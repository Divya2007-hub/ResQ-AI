"""Disaster-specific safety checklist tool — MCP-exposed.

Why MCP and not hardcoded:
  The checklist data is a single source of truth used by the Safety Agent.
  By keeping it in a dedicated tool (backed by structured data) rather than
  embedded in a prompt, we can update, localise, or expand checklists without
  touching agent definitions. It also allows future versions to source checklists
  from an external API or database without changing agent code.
"""

from mcp.tool_schemas import (
    GetDisasterChecklistInput,
    GetDisasterChecklistOutput,
    ChecklistItem,
)


# Checklist data — kept in-code for the demo; in production this could be
# loaded from a JSON/YAML file or a database.
_CHECKLISTS: dict[str, dict[int, list[dict]]] = {
    "flood": {
        1: [
            {"priority": "low", "action": "Monitor weather alerts", "details": "Stay tuned to local radio or weather app."},
            {"priority": "low", "action": "Prepare sandbags", "details": "Place sandbags at doorways if water is expected."},
        ],
        2: [
            {"priority": "medium", "action": "Move valuables to higher ground", "details": "Elevate electronics, documents, and furniture."},
            {"priority": "low", "action": "Charge devices", "details": "Keep phones and power banks fully charged."},
        ],
        3: [
            {"priority": "high", "action": "Prepare to evacuate", "details": "Pack go-bag, identify evacuation route."},
            {"priority": "high", "action": "Turn off utilities", "details": "Switch off gas and electricity if instructed."},
            {"priority": "medium", "action": "Move to upper floor", "details": "If water enters, move to highest level."},
        ],
        4: [
            {"priority": "immediate", "action": "Evacuate immediately", "details": "Do not wait. Follow official evacuation orders."},
            {"priority": "immediate", "action": "Avoid flood water", "details": "Six inches of moving water can knock you over."},
            {"priority": "high", "action": "Disconnect appliances", "details": "Unplug appliances to prevent electrical hazards."},
        ],
        5: [
            {"priority": "immediate", "action": "Evacuate now — extreme danger", "details": "Life-threatening flooding. Seek high ground immediately."},
            {"priority": "immediate", "action": "Do not drive through water", "details": "Turn around, don't drown."},
            {"priority": "immediate", "action": "Signal for help", "details": "Use whistle, flashlight, or call emergency services."},
        ],
    },
    "earthquake": {
        1: [
            {"priority": "low", "action": "Secure heavy furniture", "details": "Anchor bookshelves and cabinets to walls."},
        ],
        2: [
            {"priority": "medium", "action": "Practice drop-cover-hold", "details": "Rehearse earthquake safety with your household."},
            {"priority": "low", "action": "Prepare emergency kit", "details": "Ensure supplies are stocked and accessible."},
        ],
        3: [
            {"priority": "high", "action": "Drop, Cover, and Hold On", "details": "Get under sturdy furniture, protect head and neck."},
            {"priority": "high", "action": "Stay indoors until shaking stops", "details": "Do not run outside during shaking."},
            {"priority": "medium", "action": "Check for gas leaks", "details": "If you smell gas, evacuate and call the utility company."},
        ],
        4: [
            {"priority": "immediate", "action": "Drop, Cover, and Hold On", "details": "Stay low, cover your head, hold onto something sturdy."},
            {"priority": "immediate", "action": "Stay away from windows", "details": "Glass can shatter during strong shaking."},
            {"priority": "high", "action": "Expect aftershocks", "details": "Be prepared for further shaking after the main quake."},
            {"priority": "high", "action": "Check for structural damage", "details": "Evacuate if the building appears unstable."},
        ],
        5: [
            {"priority": "immediate", "action": "Drop, Cover, and Hold On — severe shaking", "details": "Protect yourself from falling debris."},
            {"priority": "immediate", "action": "Evacuate carefully after shaking stops", "details": "Use stairs, not elevators. Watch for debris."},
            {"priority": "immediate", "action": "Check for injuries", "details": "Provide first aid if trained. Call for help."},
            {"priority": "high", "action": "Avoid damaged areas", "details": "Stay clear of collapsed structures and broken glass."},
        ],
    },
    "cyclone": {
        1: [
            {"priority": "low", "action": "Monitor cyclone warnings", "details": "Track the storm's path via official sources."},
        ],
        2: [
            {"priority": "low", "action": "Trim trees and secure loose items", "details": "Prevent flying debris during high winds."},
            {"priority": "medium", "action": "Stock up on supplies", "details": "Food, water, batteries, and medications for 72 hours."},
        ],
        3: [
            {"priority": "high", "action": "Board up windows", "details": "Use plywood or storm shutters to protect glass."},
            {"priority": "high", "action": "Move to an interior room", "details": "Stay away from windows and exterior walls."},
            {"priority": "medium", "action": "Fill water containers", "details": "Supply may be disrupted; store drinking water."},
        ],
        4: [
            {"priority": "immediate", "action": "Evacuate if in low-lying area", "details": "Storm surges can be deadly. Follow evacuation orders."},
            {"priority": "immediate", "action": "Stay indoors — extreme winds", "details": "Do not go outside until the all-clear is given."},
            {"priority": "high", "action": "Turn off gas and electricity", "details": "Reduce fire risk from damaged lines."},
        ],
        5: [
            {"priority": "immediate", "action": "Evacuate immediately if ordered", "details": "Category 5 cyclones cause catastrophic damage."},
            {"priority": "immediate", "action": "Shelter in a sturdy building", "details": "Interior room, no windows, lowest floor."},
            {"priority": "immediate", "action": "Listen for emergency broadcasts", "details": "Battery-powered radio for updates."},
        ],
    },
    "landslide": {
        1: [
            {"priority": "low", "action": "Monitor rainfall levels", "details": "Heavy rain increases landslide risk."},
        ],
        2: [
            {"priority": "medium", "action": "Watch for early signs", "details": "Cracks in ground, tilting trees, unusual water flow."},
            {"priority": "low", "action": "Plan evacuation route", "details": "Identify higher ground away from the slide path."},
        ],
        3: [
            {"priority": "high", "action": "Evacuate if you notice ground movement", "details": "Move to higher ground immediately."},
            {"priority": "medium", "action": "Alert neighbours", "details": "Warn others in the affected area."},
        ],
        4: [
            {"priority": "immediate", "action": "Evacuate immediately", "details": "Active landslide area. Do not delay."},
            {"priority": "high", "action": "Move away from the slide path", "details": "Go uphill and to the sides, not downhill."},
        ],
        5: [
            {"priority": "immediate", "action": "Evacuate — catastrophic slide in progress", "details": "Seek high ground immediately."},
            {"priority": "immediate", "action": "Avoid river valleys and low ground", "details": "Debris flows follow drainage channels."},
        ],
    },
    "wildfire": {
        1: [
            {"priority": "low", "action": "Clear dry brush around property", "details": "Create a defensible space of at least 30 feet."},
        ],
        2: [
            {"priority": "medium", "action": "Prepare go-bag with essentials", "details": "Documents, medications, valuables ready to go."},
            {"priority": "low", "action": "Review evacuation routes", "details": "Know multiple ways out of your area."},
        ],
        3: [
            {"priority": "high", "action": "Close all windows and doors", "details": "Prevent embers from entering the house."},
            {"priority": "high", "action": "Move flammable items away from house", "details": "Patio furniture, cushions, firewood."},
            {"priority": "medium", "action": "Set up sprinklers on roof", "details": "If water pressure is available, wet the roof."},
        ],
        4: [
            {"priority": "immediate", "action": "Evacuate immediately", "details": "Wildfire approaching. Do not wait for an official order."},
            {"priority": "immediate", "action": "Wear protective clothing", "details": "Long sleeves, pants, cotton or wool, not synthetic."},
            {"priority": "high", "action": "Keep car fueled and facing out", "details": "Ready for instant departure."},
        ],
        5: [
            {"priority": "immediate", "action": "Evacuate now — extreme fire danger", "details": "Firestorm conditions. Leave immediately."},
            {"priority": "immediate", "action": "Do not attempt to fight the fire", "details": "Professional firefighters only."},
            {"priority": "immediate", "action": "Cover skin and breathe through damp cloth", "details": "Protect against smoke and radiant heat."},
        ],
    },
    "tsunami": {
        1: [
            {"priority": "low", "action": "Know tsunami warning signs", "details": "Strong earthquake, receding ocean, roaring sound."},
        ],
        2: [
            {"priority": "medium", "action": "Identify high ground routes", "details": "Plan evacuation to at least 100 feet above sea level."},
            {"priority": "low", "action": "Prepare emergency kit", "details": "Keep it accessible for quick departure."},
        ],
        3: [
            {"priority": "high", "action": "Move to high ground immediately", "details": "If you feel strong shaking near the coast, do not wait."},
            {"priority": "high", "action": "Do not go to the shore to watch", "details": "Tsunami waves can arrive minutes apart."},
        ],
        4: [
            {"priority": "immediate", "action": "Evacuate coastal area immediately", "details": "Officially warned tsunami. Go to high ground now."},
            {"priority": "immediate", "action": "Do not return after first wave", "details": "Multiple waves, the second can be larger."},
            {"priority": "high", "action": "Move inland at least 2 miles", "details": "If high ground is not available, go inland."},
        ],
        5: [
            {"priority": "immediate", "action": "Evacuate to highest ground available", "details": "Catastrophic tsunami incoming."},
            {"priority": "immediate", "action": "Climb a sturdy building if no high ground", "details": "Go to the top floor of a reinforced structure."},
            {"priority": "immediate", "action": "Hold onto something fixed", "details": "Wave force can be overwhelming."},
        ],
    },
    "unknown": {},
}


def get_disaster_checklist(
    disaster_type: str,
    severity: int,
) -> dict:
    """Return the safety checklist for a given disaster type and severity level.

    Falls back gracefully: if the disaster type or severity level has no specific
    data, returns an empty checklist rather than crashing.
    """
    inp = GetDisasterChecklistInput(disaster_type=disaster_type, severity=severity)
    dt = inp.disaster_type

    type_data = _CHECKLISTS.get(dt, {})
    items_data = type_data.get(inp.severity, [])
    # Also include all lower-severity items so nothing is missed
    for level in range(inp.severity - 1, 0, -1):
        items_data = type_data.get(level, []) + items_data

    items = [ChecklistItem(**i) for i in items_data]
    out = GetDisasterChecklistOutput(checklist=items)
    return out.model_dump()
