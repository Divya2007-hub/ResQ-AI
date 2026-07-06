"""Offline fallback cache tool — MCP-exposed.

Why MCP and not hardcoded:
  Offline resilience is a cross-cutting concern. Every agent may need to
  fall back to cached data when the Gemini API is unreachable. Hardcoding
  this into each agent would duplicate the fallback logic. As an MCP tool,
  the offline cache is a single service that any agent can query. It also
  makes the fallback behaviour explicit in the agent trace — judges can
  see when a result came from the cache vs. the live API.
"""

from mcp.tool_schemas import CheckOfflineCacheInput, CheckOfflineCacheOutput

# Static fallback data for common queries — sufficient for demo purposes.
_FALLBACK_DATA: dict[str, dict] = {
    "earthquake first aid": {
        "condition": "earthquake injuries",
        "steps": [
            {"step_number": 1, "instruction": "Check yourself for injuries before helping others.",
             "warning": "Do not move seriously injured persons unless they are in immediate danger."},
            {"step_number": 2, "instruction": "Control bleeding with direct pressure.",
             "warning": ""},
            {"step_number": 3, "instruction": "Keep injured persons warm and still.",
             "warning": "Suspect spinal injury if they were hit by falling debris."},
            {"step_number": 4, "instruction": "Call for emergency medical help as soon as possible.",
             "warning": ""},
        ],
        "disclaimer": "OFFLINE MODE — This information was loaded from cache because the live API was unavailable.",
    },
    "flood safety": {
        "priority": "immediate",
        "actions": [
            "Evacuate immediately if water is rising.",
            "Avoid walking or driving through flood water.",
            "Move to higher ground.",
            "Turn off gas and electricity if safe to do so.",
        ],
        "source_note": "OFFLINE MODE — Cached flood safety checklist.",
    },
    "emergency contacts": {
        "contacts": [
            {"service": "Emergency (Police/Fire/Ambulance)", "number": "112 (EU) / 911 (US)"},
            {"service": "Poison Control", "number": "1-800-222-1222 (US)"},
            {"service": "Disaster Distress Helpline", "number": "1-800-985-5990 (US)"},
        ],
        "source_note": "OFFLINE MODE — Cached emergency contact numbers.",
    },
}


def check_offline_cache(query: str) -> dict:
    """Look up a query in the offline fallback cache.

    Returns cached data if available, or a generic fallback result.
    The 'source' field in the output lets the agent trace show whether
    the result came from a live tool or the cache.
    """
    inp = CheckOfflineCacheInput(query=query)
    key = inp.query.lower().strip()

    data = _FALLBACK_DATA.get(key)
    if data is not None:
        out = CheckOfflineCacheOutput(found=True, source="cache", data=data)
    else:
        out = CheckOfflineCacheOutput(
            found=False,
            source="default_fallback",
            data={
                "message": (
                    f"No cached data found for '{inp.query}'. "
                    "Please try again when connectivity is restored."
                ),
            },
        )

    return out.model_dump()
