"""Communication Agent — drafts SMS and family messages for the emergency.

Role:
  Generates two types of communication: a short emergency SMS (≤ 160 chars,
  suitable for SMS gateways) and a longer, reassuring family message. Each
  uses the appropriate MCP tool to enforce the right tone and constraints.

System prompt:
  The agent generates messages based on the triage result and user location.
  It calls the appropriate messaging tool for each output type.

Tool bindings:
  - generate_emergency_sms (MCP): short alert with length enforcement.
  - generate_family_message (MCP): longer, tone-adjusted message.

Output schema:
  CommunicationOutput — sms_draft, family_message, rescue_request_draft.
"""

from google.adk.agents import Agent
from mcp.server import call_tool
from pydantic import BaseModel, Field


class CommunicationOutput(BaseModel):
    """Structured output from the Communication Agent."""
    sms_draft: str = Field(default="", description="Emergency SMS (≤ 160 characters)")
    sms_char_count: int = Field(default=0, description="Character count of the SMS")
    family_message: str = Field(default="", description="Reassuring message for family members")
    message_tone: str = Field(default="informational", description="Tone of the family message")
    rescue_request: str = Field(default="", description="Draft rescue request message")


# ── Tool wrappers ──────────────────────────────────────────────────────

def generate_emergency_sms_tool(
    recipient_name: str,
    location: str,
    disaster_type: str,
    severity: int,
    status_message: str = "I am safe for now.",
) -> dict:
    """Generate a short emergency SMS (max 160 characters).

    Args:
        recipient_name: Name of the recipient.
        location: Current location.
        disaster_type: Type of disaster.
        severity: Severity 1-5.
        status_message: Brief status update.

    Returns:
        A dict with 'sms_text' and 'char_count'.
    """
    return call_tool(
        "generate_emergency_sms",
        recipient_name=recipient_name,
        location=location,
        disaster_type=disaster_type,
        severity=severity,
        status_message=status_message,
    )


def generate_family_message_tool(
    location: str,
    disaster_type: str,
    severity: int,
    family_members: list[str] | None = None,
    additional_info: str = "",
) -> dict:
    """Generate a reassuring family message about the emergency.

    Args:
        location: Current location.
        disaster_type: Type of disaster.
        severity: Severity 1-5.
        family_members: List of family member names.
        additional_info: Any extra information to include.

    Returns:
        A dict with 'message' and 'tone'.
    """
    if family_members is None:
        family_members = ["Family"]
    return call_tool(
        "generate_family_message",
        location=location,
        disaster_type=disaster_type,
        severity=severity,
        family_members=family_members,
        additional_info=additional_info,
    )


# ── Agent definition ───────────────────────────────────────────────────

communication_agent = Agent(
    name="CommunicationAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Communication Agent in a multi-agent disaster response system.\n"
        "\n"
        "Input (from state):\n"
        "- triage_result: disaster_type, severity, location\n"
        "- household_profile: for family member info\n"
        "- routing_plan: confirms you should run\n"
        "\n"
        "Your job:\n"
        "1. Call `generate_emergency_sms_tool` with the relevant details to create "
        "a short emergency alert.\n"
        "2. Call `generate_family_message_tool` to create a longer, reassuring message "
        "for family.\n"
        "3. Draft a rescue request message that could be sent to emergency services.\n"
        "4. Output a structured CommunicationOutput.\n"
        "\n"
        "Rules:\n"
        "- The SMS must be ≤ 160 characters (the tool enforces this).\n"
        "- The family message should be calm and reassuring, not panicking.\n"
        "- The rescue request should include: location, number of people, "
        "nature of emergency, and any urgent medical needs.\n"
        "- For severity >= 4, strongly recommend contacting emergency services "
        "by phone rather than relying on text messages."
    ),
    description="Drafts emergency SMS and family notification messages.",
    output_key="communication_result",
    tools=[generate_emergency_sms_tool, generate_family_message_tool],
)
