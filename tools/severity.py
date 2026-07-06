"""Severity classification tool — MCP-exposed.

Why MCP and not hardcoded into an agent prompt:
  The same severity logic is consumed by the Triage Agent (initial classification)
  and the Planner Agent (routing decisions). Exposing it as an MCP tool means both
  agents call the same canonical function; if the classification rules need updating
  there is one place to change them, not a prompt to re-engineer.
"""

from mcp.tool_schemas import (
    ClassifySeverityInput,
    ClassifySeverityOutput,
)


SEVERITY_KEYWORDS: dict[int, list[str]] = {
    5: ["collapsed", "trapped", "massive", "catastrophic", "widespread destruction",
        "many injured", "fatalities", "entire building", "tsunami wave"],
    4: ["severe", "major flooding", "structural damage", "multiple injuries",
        "unreachable", "cut off", "widespread"],
    3: ["moderate", "rising water", "some damage", "minor injuries",
        "limited access", "partial collapse"],
    2: ["minor", "localised", "some water", "slight damage", "precautionary"],
    1: ["advisory", "watch", "preparedness", "potential", "monitor"],
}

HAZARD_KEYWORDS: dict[str, list[str]] = {
    "downed power lines": ["power line", "electrical", "spark", "live wire"],
    "chemical spill": ["chemical", "gas leak", "hazardous material", "fumes"],
    "fire hazard": ["fire", "smoke", "flame", "burning"],
    "structural instability": ["crack", "unstable", "collapsing", "damaged building"],
    "flood water": ["flood", "rising water", "submerged", "waterlogged"],
    "landslide risk": ["landslide", "mudslide", "slipping soil", "debris flow"],
}


def classify_severity(
    disaster_type: str,
    description: str,
) -> dict:
    """Classify disaster severity (1-5) and extract hazards from a description.

    Uses keyword matching as a deterministic fallback so the tool always returns
    a result without requiring a remote LLM call. This makes it reliable even
    during API outages — important for the disaster domain.
    """
    inp = ClassifySeverityInput(disaster_type=disaster_type, description=description)
    lowered = inp.description.lower()

    # Severity — highest-matching keyword tier wins
    severity: int = 1
    reasoning_parts: list[str] = []

    for level in range(5, 0, -1):
        keywords = SEVERITY_KEYWORDS[level]
        matches = [kw for kw in keywords if kw in lowered]
        if matches:
            severity = level
            reasoning_parts.append(f"matched severity-{level} keywords: {', '.join(matches)}")
            break

    if not reasoning_parts:
        reasoning_parts.append("no strong severity keywords; defaulting to level 1")

    # Hazards
    hazards: list[str] = []
    for hazard, keywords in HAZARD_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            hazards.append(hazard)

    reasoning = "; ".join(reasoning_parts)
    if hazards:
        reasoning += f" | hazards detected: {', '.join(hazards)}"

    out = ClassifySeverityOutput(
        severity=severity,
        hazards=hazards,
        reasoning=reasoning,
    )
    return out.model_dump()
