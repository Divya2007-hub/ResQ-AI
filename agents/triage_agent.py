"""Triage Agent — first point of contact for all user input.

Role:
  Classifies the disaster type and severity (1–5) from the user's description,
  and flags any vulnerable individuals mentioned (children, elderly, disabled,
  pets). This structured assessment drives the Planner Agent's routing decisions.

System prompt:
  The agent is instructed to extract factual information from the description
  and call the classify_severity tool. It should NOT speculate beyond what the
  user has provided.

Tool bindings:
  - classify_severity (MCP): deterministic severity + hazards
  - check_offline_cache (MCP): fallback if the above is unavailable

Output schema:
  TriageOutput — severity, hazards[], vulnerable_groups[], reasoning.
"""

from google.adk.agents import Agent
from mcp.server import call_tool
from pydantic import BaseModel, Field
from typing import Literal


class TriageOutput(BaseModel):
    """Structured output from the Triage Agent."""
    disaster_type: str = Field(description="Type of disaster classified from user input")
    severity: int = Field(ge=1, le=5, description="Severity rating 1 (low) – 5 (critical)")
    hazards: list[str] = Field(default_factory=list, description="Identified hazards from the description")
    vulnerable_groups: list[str] = Field(
        default_factory=list,
        description="Groups flagged: e.g. 'children', 'elderly', 'pets', 'disabled', 'pregnant'"
    )
    reasoning: str = Field(description="Explanation of the classification and routing hints")


# ── Tool wrappers ──────────────────────────────────────────────────────

def classify_severity_tool(disaster_type: str, description: str) -> dict:
    """Classify a disaster event by type and description.

    Args:
        disaster_type: The type of disaster (flood, earthquake, cyclone, etc.).
        description: A free-text description of the situation.

    Returns:
        A dict with 'severity' (int 1-5), 'hazards' (list), and 'reasoning' (str).
    """
    return call_tool("classify_severity", disaster_type=disaster_type, description=description)


def offline_fallback_tool(query: str) -> dict:
    """Look up information from the offline cache when the primary API is unreachable.

    Args:
        query: A query string to look up in the cache.

    Returns:
        A dict with 'found' (bool), 'source' (str), and 'data' (dict).
    """
    return call_tool("check_offline_cache", query=query)


# ── Agent definition ───────────────────────────────────────────────────

triage_agent = Agent(
    name="TriageAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Triage Agent in a multi-agent disaster response system.\n"
        "\n"
        "Your job:\n"
        "1. Read the user's description of the emergency.\n"
        "2. Identify the disaster type (flood, earthquake, cyclone, landslide, wildfire, tsunami, or unknown).\n"
        "3. Call `classify_severity_tool` with the disaster type and full description.\n"
        "4. From the description, list any vulnerable groups mentioned "
        "(e.g. children, elderly, pets, disabled, pregnant, medical conditions).\n"
        "5. Output a structured TriageOutput with your findings.\n"
        "\n"
        "Rules:\n"
        "- Do NOT speculate. Only report what the user has stated.\n"
        "- If the description is too vague, set severity=1 and hazards=[].\n"
        "- If classify_severity_tool fails, call offline_fallback_tool with "
        "'disaster triage <disaster_type>' as the query.\n"
        "- Your output will be read by the Planner Agent, so be precise."
    ),
    description="Classifies disasters and assesses severity for routing decisions.",
    output_key="triage_result",
    tools=[classify_severity_tool, offline_fallback_tool],
)
