"""Synthesizer — merges all specialist agent outputs into one final emergency plan.

Role:
  The Synthesizer is the final stage of the agent pipeline. It reads the outputs
  from all invoked specialist agents (Safety, Medical, Supply, Communication)
  and merges them into a single, prioritised emergency plan.

  It resolves any conflicts, orders items by urgency, and produces the final
  structured output that the UI renders.

System prompt:
  The synthesizer receives all agent outputs from state, prioritises them,
  and produces a unified plan. It does NOT call any tools — it reasons over
  existing data.

Output schema:
  EmergencyPlan — priority_level, immediate_safety_steps[], medical_advice[],
    supply_checklist[], communication_drafts, recovery_checklist[].
"""

from google.adk.agents import Agent
from pydantic import BaseModel, Field


class PlanItem(BaseModel):
    """An item in the final emergency plan."""
    priority: str = Field(description="immediate, high, medium, or low")
    category: str = Field(description="safety, medical, supply, communication, or recovery")
    content: str = Field(description="The actionable item")
    source_agent: str = Field(default="", description="Which agent produced this item")


class EmergencyPlan(BaseModel):
    """The final merged emergency plan presented to the user."""
    priority_level: str = Field(description="Overall priority: critical, severe, moderate, low")
    severity_score: int = Field(ge=1, le=5, description="Original severity from triage")
    immediate_safety_steps: list[str] = Field(
        default_factory=list,
        description="Life-saving actions to take right now (ordered)"
    )
    medical_advice: list[str] = Field(
        default_factory=list,
        description="Medical/first aid guidance (with disclaimer)"
    )
    supply_checklist: list[PlanItem] = Field(
        default_factory=list,
        description="Supply items organised by category"
    )
    communication_drafts: dict[str, str] = Field(
        default_factory=dict,
        description="Draft messages: sms, family_message, rescue_request"
    )
    recovery_checklist: list[str] = Field(
        default_factory=list,
        description="Post-emergency steps (documentation, insurance, medical follow-up)"
    )
    agent_trace_summary: list[dict] = Field(
        default_factory=list,
        description="Summary of which agents ran and what they contributed"
    )
    disclaimers: list[str] = Field(
        default_factory=list,
        description="Medical and emergency disclaimers"
    )


# ── Agent definition ───────────────────────────────────────────────────

synthesizer_agent = Agent(
    name="SynthesizerAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Synthesizer Agent — the final stage of a multi-agent "
        "disaster response system.\n"
        "\n"
        "You receive the outputs of all specialist agents from state:\n"
        "- state['triage_result']: disaster type, severity, hazards, vulnerable groups\n"
        "- state['routing_plan']: which agents were invoked\n"
        "- state['safety_result']: hazard warnings and safety checklist (if invoked)\n"
        "- state['medical_result']: first aid guidance (if invoked)\n"
        "- state['supply_result']: supply checklist (if invoked)\n"
        "- state['communication_result']: message drafts (if invoked)\n"
        "- state['household_profile']: household composition\n"
        "\n"
        "Your job:\n"
        "1. Read all available agent outputs (some may be absent if not invoked).\n"
        "2. Merge them into a single EmergencyPlan.\n"
        "3. Order everything by priority: immediate actions first.\n"
        "4. Resolve conflicts: if two agents give conflicting advice, prefer the "
        "more conservative/safe option.\n"
        "5. Generate a recovery checklist (post-emergency steps).\n"
        "6. Include disclaimers for medical advice and emergency guidance.\n"
        "7. Populate the agent_trace_summary with which agents contributed.\n"
        "\n"
        "Priority mapping from severity:\n"
        "- severity 5: critical\n"
        "- severity 4: critical\n"
        "- severity 3: severe\n"
        "- severity 2: moderate\n"
        "- severity 1: low\n"
        "\n"
        "Rules:\n"
        "- Every plan must begin with immediate safety steps (even if no safety agent ran).\n"
        "- Medical advice must ALWAYS include the disclaimer.\n"
        "- Recovery checklist should include: document damage, contact insurance, "
        "seek medical follow-up, mental health support.\n"
        "- Do NOT fabricate information — only use what the agents provided.\n"
        "- If an agent was not invoked, leave its section empty (do not fill it in)."
    ),
    description="Merges all agent outputs into a final prioritised emergency plan.",
    output_key="final_plan",
)
