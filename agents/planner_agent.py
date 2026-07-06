"""Planner Agent — reads triage output and decides which specialist agents to invoke.

Role:
  The Planner Agent is the decision-making hub. It reads the Triage Agent's
  structured output and decides which of the four specialist agents (Safety,
  Medical, Supply, Communication) should be invoked and in what order.

  Its decisions are logged as a "routing plan" that is shown in the agent trace
  so judges can see the reasoning behind every delegation.

System prompt:
  The agent receives the triage result and household profile from state, then
  produces a routing plan. It must explain WHY each agent was included or skipped.

Output schema:
  RoutingPlan — agents_to_invoke (ordered list), reasoning (per-agent).
"""

from google.adk.agents import Agent
from pydantic import BaseModel, Field


class AgentDecision(BaseModel):
    """Decision for a single specialist agent."""
    agent_name: str = Field(description="Name of the agent: SafetyAgent, MedicalAgent, SupplyAgent, CommunicationAgent")
    invoke: bool = Field(description="Whether this agent should be invoked")
    priority: int = Field(ge=1, le=4, description="Priority order (1 = highest)")
    justification: str = Field(description="Why this agent was included or skipped")


class RoutingPlan(BaseModel):
    """The Planner's structured routing decision."""
    severity: int = Field(ge=1, le=5)
    decisions: list[AgentDecision] = Field(description="Decision for each specialist agent")
    summary: str = Field(description="One-sentence summary of the routing strategy")


# ── Agent definition ───────────────────────────────────────────────────

planner_agent = Agent(
    name="PlannerAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Planner Agent in a multi-agent disaster response system.\n"
        "\n"
        "You receive the Triage Agent's output (disaster_type, severity, hazards, "
        "vulnerable_groups) via state['triage_result'] and the user's household "
        "profile via state['household_profile'].\n"
        "\n"
        "Your job is to produce a RoutingPlan deciding which of the four specialist "
        "agents to invoke:\n"
        "- SafetyAgent: immediate safety actions and hazard warnings.\n"
        "- MedicalAgent: first aid and medication guidance.\n"
        "- SupplyAgent: emergency kit checklist (parameterised by household).\n"
        "- CommunicationAgent: SMS and family message drafts.\n"
        "\n"
        "Routing rules:\n"
        "1. SafetyAgent is ALWAYS invoked (every emergency needs safety steps).\n"
        "2. MedicalAgent is invoked UNLESS severity <= 2 AND no medical conditions "
        "in household_profile.\n"
        "3. SupplyAgent is invoked UNLESS severity <= 2 AND no vulnerable groups.\n"
        "4. CommunicationAgent is invoked if severity >= 3 OR there are vulnerable "
        "groups that need family notification.\n"
        "\n"
        "For each agent, explain WHY you included or skipped it. "
        "Assign priority 1=Safety, then by relevance.\n"
        "\n"
        "Output a structured RoutingPlan."
    ),
    description="Decides which specialist agents to invoke based on triage and household profile.",
    output_key="routing_plan",
)
