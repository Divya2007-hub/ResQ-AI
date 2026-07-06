"""Safety Agent — immediate safety actions and hazard warnings.

Role:
  Provides a prioritised safety checklist based on the disaster type and severity.
  Also generates clear hazard warnings for any identified dangers.

System prompt:
  The agent receives the disaster type, severity, and hazards from the triage
  result. It calls get_disaster_checklist to get the canonical checklist for
  the situation, then presents it ordered by priority.

Tool bindings:
  - get_disaster_checklist (MCP): returns structured checklist items.
  - check_offline_cache (MCP): fallback if no response from primary tool.

Output schema:
  SafetyOutput — priority_level, hazard_warnings[], checklist[], evacuation_advice.
"""

from google.adk.agents import Agent
from mcp.server import call_tool
from pydantic import BaseModel, Field


class SafetyItem(BaseModel):
    """A single safety checklist item."""
    priority: str = Field(description="immediate, high, medium, or low")
    action: str = Field(description="The action to take")
    details: str = Field(default="", description="Additional details or warnings")


class SafetyOutput(BaseModel):
    """Structured output from the Safety Agent."""
    priority_level: str = Field(description="Overall safety priority level: immediate, high, medium, low")
    hazard_warnings: list[str] = Field(default_factory=list, description="Specific hazard warnings for the user")
    checklist: list[SafetyItem] = Field(default_factory=list, description="Prioritised safety checklist")
    evacuation_advice: str = Field(default="", description="Evacuation guidance if applicable")


# ── Tool wrappers ──────────────────────────────────────────────────────

def get_disaster_checklist_tool(disaster_type: str, severity: int) -> dict:
    """Retrieve a prioritised safety checklist for a disaster type and severity.

    Args:
        disaster_type: The type of disaster (flood, earthquake, etc.).
        severity: Severity rating 1–5.

    Returns:
        A dict with a 'checklist' key containing list of {priority, action, details}.
    """
    return call_tool("get_disaster_checklist", disaster_type=disaster_type, severity=severity)


def offline_fallback_tool(query: str) -> dict:
    """Look up information from the offline cache.

    Args:
        query: Query string for the cache.

    Returns:
        Cached data dict with 'found', 'source', 'data' keys.
    """
    return call_tool("check_offline_cache", query=query)


# ── Agent definition ───────────────────────────────────────────────────

safety_agent = Agent(
    name="SafetyAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Safety Agent in a multi-agent disaster response system.\n"
        "\n"
        "Input (from state):\n"
        "- disaster_type, severity, hazards from triage_result\n"
        "- routing_plan (confirms you should run)\n"
        "\n"
        "Your job:\n"
        "1. Call `get_disaster_checklist_tool` with the disaster type and severity.\n"
        "2. If the tool fails, call `offline_fallback_tool` with '<disaster_type> safety'.\n"
        "3. From the checklist, identify the highest priority items and any evacuation advice.\n"
        "4. Output a structured SafetyOutput with hazard warnings, prioritised checklist, "
        "and evacuation advice.\n"
        "\n"
        "Rules:\n"
        "- Order checklist items by priority (immediate first, then high, medium, low).\n"
        "- Evacuation advice: if severity >= 4, strongly recommend evacuation.\n"
        "- Hazard warnings: highlight any life-threatening hazards from the input."
    ),
    description="Provides prioritised safety actions and hazard warnings.",
    output_key="safety_result",
    tools=[get_disaster_checklist_tool, offline_fallback_tool],
)
