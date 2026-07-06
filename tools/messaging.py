"""Emergency messaging tools — MCP-exposed.

Why MCP and not hardcoded:
  These two message generators serve different constraints (SMS: ≤160 chars;
  family message: reassuring tone, no length limit). Both are called by the
  Communication Agent. By keeping them as MCP tools they are independently
  testable and reusable (e.g., the SMS generator could be called by a
  standalone alerting system without going through the full agent pipeline).
"""

from mcp.tool_schemas import (
    GenerateSmsInput,
    GenerateSmsOutput,
    GenerateFamilyMessageInput,
    GenerateFamilyMessageOutput,
)


def generate_emergency_sms(
    recipient_name: str,
    location: str,
    disaster_type: str,
    severity: int,
    status_message: str = "I am safe for now.",
) -> dict:
    """Generate a short emergency SMS (≤ 160 characters) for a single recipient.

    The character restriction is what makes this distinct from other messaging
    tools — it enforces brevity suitable for SMS gateways or emergency alerts.
    """
    inp = GenerateSmsInput(
        recipient_name=recipient_name,
        location=location,
        disaster_type=disaster_type,
        severity=severity,
        status_message=status_message,
    )

    base = f"{inp.disaster_type.upper()} alert at {inp.location}. Sev {inp.severity}/5. {inp.status_message}"
    signature = " -ResQ AI"

    # Fit recipient greeting + body + signature within 160 chars
    greeting = f"Hi {inp.recipient_name}, "
    max_body = 160 - len(greeting) - len(signature)

    if len(base) > max_body:
        # Truncate the status message to fit
        max_status = max_body - len(f"{inp.disaster_type.upper()} alert at {inp.location}. Sev {inp.severity}/5. ")
        truncated_status = inp.status_message[:max_status - 3] + "..."
        body = f"{inp.disaster_type.upper()} alert at {inp.location}. Sev {inp.severity}/5. {truncated_status}"
    else:
        body = base

    sms = f"{greeting}{body}{signature}"

    out = GenerateSmsOutput(sms_text=sms, char_count=len(sms))
    return out.model_dump()


def generate_family_message(
    location: str,
    disaster_type: str,
    severity: int,
    family_members: list[str] | None = None,
    additional_info: str = "",
) -> dict:
    """Generate a reassuring but honest family message about the emergency.

    Unlike the SMS tool, this has no hard character limit — the goal is
    information completeness with a calm, reassuring tone. The tone is
    automatically adjusted based on severity level.
    """
    if family_members is None:
        family_members = ["family"]

    inp = GenerateFamilyMessageInput(
        location=location,
        disaster_type=disaster_type,
        severity=severity,
        family_members=family_members,
        additional_info=additional_info,
    )

    greeting = f"To {', '.join(inp.family_members)},"

    severity_labels = {1: "advisory", 2: "minor", 3: "moderate", 4: "severe", 5: "critical"}
    sev_label = severity_labels.get(inp.severity, "reported")

    body = (
        f"We are currently experiencing a {sev_label} {inp.disaster_type} event "
        f"in {inp.location}. "
    )

    if inp.severity <= 2:
        body += "We are monitoring the situation closely and are taking precautions. "
        tone = "reassuring"
    elif inp.severity <= 3:
        body += "We have a plan and are following safety protocols. Please stay by your phone. "
        tone = "reassuring"
    elif inp.severity <= 4:
        body += (
            "We are following emergency procedures. Please be on standby and "
            "prepare for possible evacuation. We will update you as soon as we can. "
        )
        tone = "urgent"
    else:
        body += (
            "This is a critical situation. We are taking immediate action to ensure safety. "
            "Please await further updates and follow any evacuation orders. "
        )
        tone = "urgent"

    if inp.additional_info:
        body += f"\n\nAdditional: {inp.additional_info}"

    body += "\n\nWe will share more updates as the situation evolves. Stay safe."
    sign_off = "\n\n— ResQ AI Emergency Alert System"

    message = f"{greeting}\n\n{body}{sign_off}"

    out = GenerateFamilyMessageOutput(message=message, tone=tone)
    return out.model_dump()
