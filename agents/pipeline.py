"""Pipeline orchestrator — runs the multi-agent disaster response workflow.

This module manages the end-to-end execution of all agents with conditional
routing, state propagation, and trace event capture. It is the main entry
point that the Streamlit frontend calls.

Flow:
  1. sanitize_input (mandatory security gate)
  2. Triage Agent → classifies disaster + severity + vulnerable groups
  3. Planner Agent → reads triage output, decides routing
  4. Conditional specialist agents (Safety, Medical, Supply, Communication)
  5. Synthesizer Agent → merges all outputs into final plan
"""

import asyncio
import time
from typing import Any

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from config.settings import GEMINI_MODEL
from mcp.server import call_tool
from agents.triage_agent import triage_agent
from agents.planner_agent import planner_agent
from agents.safety_agent import safety_agent
from agents.medical_agent import medical_agent
from agents.supply_agent import supply_agent
from agents.communication_agent import communication_agent
from agents.synthesizer import synthesizer_agent


class TraceEvent:
    """A single event in the agent trace log, shown in the UI."""

    def __init__(
        self,
        agent: str,
        status: str,
        summary: str,
        tool_calls: list[dict] | None = None,
        duration_ms: float = 0.0,
    ):
        self.agent = agent
        self.status = status  # "running", "completed", "skipped", "error"
        self.summary = summary
        self.tool_calls = tool_calls or []
        self.duration_ms = duration_ms
        self.timestamp = time.time()

    def to_dict(self) -> dict:
        return {
            "agent": self.agent,
            "status": self.status,
            "summary": self.summary,
            "tool_calls": self.tool_calls,
            "duration_ms": round(self.duration_ms, 1),
        }


class PipelineResult:
    """Result of running the full agent pipeline."""

    def __init__(self):
        self.trace: list[dict] = []
        self.final_plan: dict = {}
        self.sanitization_result: dict = {}
        self.error: str | None = None


# ── ADK session service (shared in-memory) ────────────────────────────

_session_service = InMemorySessionService()
_APP_NAME = "resq_ai"


def _run_agent_sync(
    agent: Any,
    user_id: str,
    session_id: str,
    message_text: str,
) -> list[dict]:
    """Run an ADK agent synchronously and return captured events.

    This helper wraps the async ADK Runner in a synchronous call so it can
    be used from Streamlit without async/await complexity.
    """
    events_captured: list[dict] = []

    async def _run():
        runner = Runner(
            agent=agent,
            app_name=_APP_NAME,
            session_service=_session_service,
        )

        # Ensure the session exists
        try:
            await _session_service.create_session(
                app_name=_APP_NAME, user_id=user_id, session_id=session_id
            )
        except Exception:
            pass  # Session already exists

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=types.Content(
                role="user",
                parts=[types.Part.from_text(text=message_text)],
            ),
        ):
            if event.is_final_response():
                text = event.content.parts[0].text if event.content.parts else ""
                events_captured.append({
                    "type": "final",
                    "content": text,
                    "actions": event.actions.model_dump() if event.actions else {},
                })
            elif event.content and event.content.parts:
                for part in event.content.parts:
                    if part.function_call:
                        events_captured.append({
                            "type": "tool_call",
                            "name": part.function_call.name,
                            "args": dict(part.function_call.args) if part.function_call.args else {},
                        })
                    elif part.function_response:
                        events_captured.append({
                            "type": "tool_response",
                            "name": part.function_response.name,
                            "response": dict(part.function_response.response) if part.function_response.response else {},
                        })

    asyncio.run(_run())
    return events_captured


def _get_session_state(user_id: str, session_id: str) -> dict:
    """Retrieve the current state dict from a session."""
    try:
        session = asyncio.run(
            _session_service.get_session(
                app_name=_APP_NAME, user_id=user_id, session_id=session_id
            )
        )
        return dict(session.state) if session else {}
    except Exception:
        return {}


def run_pipeline(
    user_input: str,
    disaster_type: str,
    location: str,
    household_profile: dict,
    security_test_mode: bool = False,
) -> PipelineResult:
    """Execute the full agent pipeline and return the result + trace.

    Args:
        user_input: The user's free-text description of the emergency.
        disaster_type: Type of disaster selected from the form.
        location: User's location.
        household_profile: Dict with num_adults, num_children, num_elderly,
            num_pets, has_medical_conditions, specific_conditions.
        security_test_mode: If True, skip sanitization (for demo purposes).

    Returns:
        PipelineResult with trace events and final plan.
    """
    result = PipelineResult()
    user_id = "default_user"
    session_id = f"session_{int(time.time())}"

    # ── Step 0: Sanitize input ────────────────────────────────────────
    start = time.time()
    if not security_test_mode:
        sanitized = call_tool("sanitize_input", raw_text=user_input)
    else:
        # In security test mode, we still sanitize but don't block
        sanitized = call_tool("sanitize_input", raw_text=user_input)

    result.sanitization_result = sanitized
    trace_step = TraceEvent(
        agent="SanitizeInput",
        status="completed",
        summary=f"Input sanitization: {'FLAGGED' if sanitized['flagged'] else 'PASSED'} — {sanitized['reason']}",
        duration_ms=(time.time() - start) * 1000,
    )
    result.trace.append(trace_step.to_dict())

    # If flagged and NOT in security test mode, abort
    if sanitized["flagged"] and not security_test_mode:
        trace_step.status = "error"
        trace_step.summary = "Pipeline aborted: input flagged as potential injection."
        result.trace[-1] = trace_step.to_dict()
        result.error = f"Input blocked: {sanitized['reason']}"
        return result

    # ── Step 1: Triage Agent ──────────────────────────────────────────
    start = time.time()
    triage_message = (
        f"Disaster type: {disaster_type}\n"
        f"Location: {location}\n"
        f"Description: {user_input}\n\n"
        f"Household: {household_profile}"
    )
    try:
        triage_events = _run_agent_sync(
            triage_agent, user_id, session_id, triage_message
        )
        state = _get_session_state(user_id, session_id)
        triage_result = state.get("triage_result", {})
        trace_step = TraceEvent(
            agent="TriageAgent",
            status="completed",
            summary=(
                f"Classified as {triage_result.get('disaster_type', 'unknown')} "
                f"(severity {triage_result.get('severity', '?')}/5). "
                f"Hazards: {triage_result.get('hazards', [])}. "
                f"Vulnerable: {triage_result.get('vulnerable_groups', [])}."
            ),
            tool_calls=[e for e in triage_events if e["type"] == "tool_call"],
            duration_ms=(time.time() - start) * 1000,
        )
    except Exception as exc:
        trace_step = TraceEvent(
            agent="TriageAgent", status="error",
            summary=f"Failed: {exc}", duration_ms=(time.time() - start) * 1000,
        )
        result.error = str(exc)
        result.trace.append(trace_step.to_dict())
        return result
    result.trace.append(trace_step.to_dict())

    # ── Step 2: Planner Agent ─────────────────────────────────────────
    start = time.time()
    planner_message = (
        f"Triage result: {triage_result}\n"
        f"Household profile: {household_profile}\n"
        f"Decide which specialist agents to invoke."
    )
    try:
        planner_events = _run_agent_sync(
            planner_agent, user_id, session_id, planner_message
        )
        state = _get_session_state(user_id, session_id)
        routing_plan = state.get("routing_plan", {})
        decisions = routing_plan.get("decisions", [])
        invoked = [d["agent_name"] for d in decisions if d.get("invoke")]
        skipped = [d["agent_name"] for d in decisions if not d.get("invoke")]
        trace_step = TraceEvent(
            agent="PlannerAgent",
            status="completed",
            summary=(
                f"Routing decision: invoked={invoked}, skipped={skipped}. "
                f"Strategy: {routing_plan.get('summary', '')}"
            ),
            tool_calls=[],
            duration_ms=(time.time() - start) * 1000,
        )
    except Exception as exc:
        trace_step = TraceEvent(
            agent="PlannerAgent", status="error",
            summary=f"Failed: {exc}", duration_ms=(time.time() - start) * 1000,
        )
        result.error = str(exc)
        result.trace.append(trace_step.to_dict())
        return result
    result.trace.append(trace_step.to_dict())

    # Build a lookup for decisions
    decision_map: dict[str, bool] = {}
    for d in decisions:
        decision_map[d["agent_name"]] = d.get("invoke", False)

    # ── Step 3: Conditional specialist agents ─────────────────────────
    specialist_configs = [
        ("SafetyAgent", safety_agent, decision_map.get("SafetyAgent", True)),
        ("MedicalAgent", medical_agent, decision_map.get("MedicalAgent", False)),
        ("SupplyAgent", supply_agent, decision_map.get("SupplyAgent", False)),
        ("CommunicationAgent", communication_agent, decision_map.get("CommunicationAgent", False)),
    ]

    for agent_name, agent_obj, should_invoke in specialist_configs:
        start = time.time()
        if not should_invoke:
            trace_step = TraceEvent(
                agent=agent_name,
                status="skipped",
                summary="Planner determined this agent was not needed.",
                duration_ms=(time.time() - start) * 1000,
            )
            result.trace.append(trace_step.to_dict())
            continue

        specialist_message = (
            f"Emergency situation:\n"
            f"Triage: {triage_result}\n"
            f"Household: {household_profile}\n"
            f"Routing plan: {routing_plan}\n"
            f"Please provide your specialist analysis."
        )
        try:
            spec_events = _run_agent_sync(
                agent_obj, user_id, session_id, specialist_message
            )
            state = _get_session_state(user_id, session_id)
            result_key = {
                "SafetyAgent": "safety_result",
                "MedicalAgent": "medical_result",
                "SupplyAgent": "supply_result",
                "CommunicationAgent": "communication_result",
            }[agent_name]
            spec_result = state.get(result_key, {})
            trace_step = TraceEvent(
                agent=agent_name,
                status="completed",
                summary=f"Completed successfully. Output keys: {list(spec_result.keys())[:3]}",
                tool_calls=[e for e in spec_events if e["type"] == "tool_call"],
                duration_ms=(time.time() - start) * 1000,
            )
        except Exception as exc:
            trace_step = TraceEvent(
                agent=agent_name, status="error",
                summary=f"Failed: {exc}",
                duration_ms=(time.time() - start) * 1000,
            )
        result.trace.append(trace_step.to_dict())

    # ── Step 4: Synthesizer Agent ─────────────────────────────────────
    start = time.time()
    state = _get_session_state(user_id, session_id)
    synthesizer_message = (
        f"Triage result: {state.get('triage_result', {})}\n"
        f"Routing plan: {state.get('routing_plan', {})}\n"
        f"Safety result: {state.get('safety_result', {})}\n"
        f"Medical result: {state.get('medical_result', {})}\n"
        f"Supply result: {state.get('supply_result', {})}\n"
        f"Communication result: {state.get('communication_result', {})}\n"
        f"Household profile: {household_profile}\n"
        f"Merge all results into a final EmergencyPlan."
    )
    try:
        synth_events = _run_agent_sync(
            synthesizer_agent, user_id, session_id, synthesizer_message
        )
        state = _get_session_state(user_id, session_id)
        final_plan = state.get("final_plan", {})
        result.final_plan = final_plan
        trace_step = TraceEvent(
            agent="SynthesizerAgent",
            status="completed",
            summary=f"Final plan generated.",
            duration_ms=(time.time() - start) * 1000,
        )
    except Exception as exc:
        trace_step = TraceEvent(
            agent="SynthesizerAgent", status="error",
            summary=f"Failed: {exc}",
            duration_ms=(time.time() - start) * 1000,
        )
        result.error = str(exc)
    result.trace.append(trace_step.to_dict())

    return result
