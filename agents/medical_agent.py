"""Medical Agent — first aid guidance and medication reminders.

Role:
  Provides step-by-step first aid instructions for conditions mentioned in the
  user input. Also flags any medication needs based on household medical conditions.
  Always includes the mandatory medical disclaimer.

System prompt:
  The agent must never claim to replace professional medical advice. The disclaimer
  is returned with every response.

Tool bindings:
  - get_first_aid (MCP): canonical first aid steps for a given condition.
  - check_offline_cache (MCP): fallback with basic first aid data.

Output schema:
  MedicalOutput — conditions_with_advice[], medication_reminders[], disclaimer.
"""

from google.adk.agents import Agent
from mcp.server import call_tool
from pydantic import BaseModel, Field


class ConditionAdvice(BaseModel):
    """First aid advice for one condition."""
    condition: str = Field(description="The medical condition or injury")
    steps: list[dict] = Field(default_factory=list, description="Step-by-step instructions")
    warning: str = Field(default="", description="Any warnings for this condition")


class MedicalOutput(BaseModel):
    """Structured output from the Medical Agent."""
    conditions_with_advice: list[ConditionAdvice] = Field(
        default_factory=list,
        description="First aid guidance for each condition"
    )
    medication_reminders: list[str] = Field(
        default_factory=list,
        description="Medication reminders based on household medical conditions"
    )
    disclaimer: str = Field(
        default="This is AI-generated guidance only. Always consult a professional medical practitioner in an emergency.",
        description="Mandatory medical disclaimer"
    )


# ── Tool wrappers ──────────────────────────────────────────────────────

def get_first_aid_tool(condition: str) -> dict:
    """Get step-by-step first aid instructions for a condition.

    Args:
        condition: The medical condition or injury (e.g. 'bleeding', 'burn').

    Returns:
        A dict with 'condition', 'steps', and 'disclaimer'.
    """
    return call_tool("get_first_aid", condition=condition)


def offline_fallback_tool(query: str) -> dict:
    """Look up medical guidance from offline cache.

    Args:
        query: Query string like 'earthquake first aid'.

    Returns:
        Cached medical guidance data.
    """
    return call_tool("check_offline_cache", query=query)


# ── Agent definition ───────────────────────────────────────────────────

medical_agent = Agent(
    name="MedicalAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Medical Agent in a multi-agent disaster response system.\n"
        "\n"
        "Input (from state):\n"
        "- triage_result: disaster type, severity, vulnerable_groups\n"
        "- household_profile: has_medical_conditions, specific_conditions\n"
        "- routing_plan: confirms you should run\n"
        "\n"
        "Your job:\n"
        "1. From the user input and household profile, identify any medical conditions "
        "that need first aid guidance.\n"
        "2. For each condition, call `get_first_aid_tool`.\n"
        "3. If a tool fails, use `offline_fallback_tool` with '<condition> first aid'.\n"
        "4. If the household has medical conditions, list medication reminders.\n"
        "5. ALWAYS include the medical disclaimer.\n"
        "\n"
        "Rules:\n"
        "- NEVER claim to replace a doctor, paramedic, or emergency medical services.\n"
        "- For severity >= 4, strongly recommend calling emergency services.\n"
        "- Common conditions to check for: bleeding, burns, fractures, choking, "
        "heart attack, shock, hypothermia.\n"
        "- If no conditions are mentioned, include a general 'stay safe and monitor "
        "for injuries' note."
    ),
    description="Provides first aid guidance and medication reminders with mandatory disclaimer.",
    output_key="medical_result",
    tools=[get_first_aid_tool, offline_fallback_tool],
)
