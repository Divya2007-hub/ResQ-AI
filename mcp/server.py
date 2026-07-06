"""MCP (Model Context Protocol) server for ResQ AI.

Registers all emergency-response tools so they can be invoked by ADK agents
at runtime via tool-calling. Each tool is registered with its input/output
schema, a description for the LLM, and a callable function.

The server itself is a plain registry (dict) rather than a network server
for simplicity in this demo. The same tool definitions could be served over
HTTP (SSE or stdio transport) for production deployments.
"""

from typing import Any, Callable

from mcp.tool_schemas import (
    ClassifySeverityInput,
    ClassifySeverityOutput,
    GetDisasterChecklistInput,
    GetDisasterChecklistOutput,
    GetFirstAidInput,
    GetFirstAidOutput,
    EmergencySupplyListOutput,
    GenerateSmsInput,
    GenerateSmsOutput,
    GenerateFamilyMessageInput,
    GenerateFamilyMessageOutput,
    SanitizeInput,
    SanitizeOutput,
    CheckOfflineCacheInput,
    CheckOfflineCacheOutput,
    HouseholdProfile,
)
from tools.severity import classify_severity
from tools.checklist import get_disaster_checklist
from tools.first_aid import get_first_aid
from tools.supplies import emergency_supply_list
from tools.messaging import generate_emergency_sms, generate_family_message
from tools.security import sanitize_input
from tools.offline_cache import check_offline_cache


class ToolRegistration:
    """Describes a single MCP tool available to agents."""

    def __init__(
        self,
        name: str,
        description: str,
        input_schema: type,
        output_schema: type,
        fn: Callable[..., dict],
    ):
        self.name = name
        self.description = description
        self.input_schema = input_schema
        self.output_schema = output_schema
        self.fn = fn

    def __call__(self, **kwargs: Any) -> dict:
        return self.fn(**kwargs)

    def to_dict(self) -> dict:
        """Return a tool descriptor suitable for ADK tool registration."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.input_schema.model_json_schema(),
        }


# ── Tool registry ──────────────────────────────────────────────────────

_TOOLS: dict[str, ToolRegistration] = {}


def _register(tool: ToolRegistration) -> None:
    _TOOLS[tool.name] = tool


_register(ToolRegistration(
    name="classify_severity",
    description=(
        "Classify a disaster event by type and description, returning a severity "
        "rating (1–5) and a list of identified hazards. Used by the Triage Agent "
        "to determine how serious the situation is and by the Planner Agent to "
        "decide which specialist agents to invoke."
    ),
    input_schema=ClassifySeverityInput,
    output_schema=ClassifySeverityOutput,
    fn=classify_severity,
))

_register(ToolRegistration(
    name="get_disaster_checklist",
    description=(
        "Return a prioritised safety checklist for a given disaster type and "
        "severity level. Items are tagged with priority (immediate/high/medium/low). "
        "Called by the Safety Agent to produce actionable safety steps."
    ),
    input_schema=GetDisasterChecklistInput,
    output_schema=GetDisasterChecklistOutput,
    fn=get_disaster_checklist,
))

_register(ToolRegistration(
    name="get_first_aid",
    description=(
        "Return step-by-step first-aid instructions for a given medical condition "
        "(e.g. 'bleeding', 'burn', 'fracture'). Includes a mandatory medical "
        "disclaimer. Called by the Medical Agent."
    ),
    input_schema=GetFirstAidInput,
    output_schema=GetFirstAidOutput,
    fn=get_first_aid,
))

_register(ToolRegistration(
    name="emergency_supply_list",
    description=(
        "Generate a tailored emergency supply checklist based on a household "
        "profile (number of adults, children, elderly, pets, and any medical "
        "conditions). Called by the Supply Agent."
    ),
    input_schema=HouseholdProfile,
    output_schema=EmergencySupplyListOutput,
    fn=emergency_supply_list,
))

_register(ToolRegistration(
    name="generate_emergency_sms",
    description=(
        "Generate a short emergency SMS (max 160 characters) suitable for SMS "
        "gateways. Enforces the character limit automatically. Called by the "
        "Communication Agent when the user wants to alert a single contact."
    ),
    input_schema=GenerateSmsInput,
    output_schema=GenerateSmsOutput,
    fn=generate_emergency_sms,
))

_register(ToolRegistration(
    name="generate_family_message",
    description=(
        "Generate a longer, reassuring family message about the emergency. "
        "Has no character limit; the tone adjusts automatically based on severity. "
        "Called by the Communication Agent for family-group notifications."
    ),
    input_schema=GenerateFamilyMessageInput,
    output_schema=GenerateFamilyMessageOutput,
    fn=generate_family_message,
))

_register(ToolRegistration(
    name="sanitize_input",
    description=(
        "Scan user input for prompt-injection patterns and harmful content. "
        "Must be called BEFORE any agent is invoked on untrusted user input. "
        "Returns whether the input was flagged and a human-readable reason."
    ),
    input_schema=SanitizeInput,
    output_schema=SanitizeOutput,
    fn=sanitize_input,
))

_register(ToolRegistration(
    name="check_offline_cache",
    description=(
        "Look up a query in the local offline fallback cache. Returns cached "
        "data when the live Gemini API is unreachable. The 'source' field "
        "indicates whether the result came from cache or default fallback. "
        "Any agent can call this for resilience."
    ),
    input_schema=CheckOfflineCacheInput,
    output_schema=CheckOfflineCacheOutput,
    fn=check_offline_cache,
))


# ── Public API ──────────────────────────────────────────────────────────

def get_tool(name: str) -> ToolRegistration | None:
    """Retrieve a tool by name. Returns None if not found."""
    return _TOOLS.get(name)


def list_tools() -> list[dict]:
    """Return all registered tools as ADK-compatible descriptors."""
    return [t.to_dict() for t in _TOOLS.values()]


def call_tool(name: str, **kwargs: Any) -> dict:
    """Execute a tool by name with the given arguments.

    Validates inputs against the registered schema before calling the function.
    Raises ValueError if the tool is unknown.
    """
    tool = get_tool(name)
    if tool is None:
        raise ValueError(f"Unknown tool: '{name}'. Available: {list(_TOOLS.keys())}")

    # Validate input via Pydantic
    validated = tool.input_schema(**kwargs)
    result = tool.fn(**validated.model_dump())
    # Validate output via Pydantic
    tool.output_schema(**result)
    return result
