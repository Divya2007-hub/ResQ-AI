"""Emergency supply checklist tool — MCP-exposed.

Why MCP and not hardcoded:
  The supply list needs to be dynamically parametrised by household profile
  (adults, children, elderly, pets, medical conditions). Hardcoding this
  logic into the Supply Agent's prompt would make it brittle and hard to
  maintain. As an MCP tool, the agent simply passes the profile and receives
  a tailored list. The same tool could be reused by other hosts (e.g. a
  mobile app) without duplicating logic.
"""

from mcp.tool_schemas import (
    EmergencySupplyListOutput,
    SupplyItem,
    HouseholdProfile,
)


# Base items for every household.
_BASE_SUPPLIES: list[dict] = [
    {"name": "Water (1 gallon/person/day for 3 days)", "quantity": "3+ gallons per person", "category": "water"},
    {"name": "Non-perishable food (3-day supply)", "quantity": "3 days per person", "category": "food"},
    {"name": "First aid kit", "quantity": "1", "category": "medical"},
    {"name": "Flashlight", "quantity": "1 per adult", "category": "safety"},
    {"name": "Battery-powered radio", "quantity": "1", "category": "safety"},
    {"name": "Extra batteries", "quantity": "Multi-pack", "category": "safety"},
    {"name": "Multi-purpose tool", "quantity": "1", "category": "safety"},
    {"name": "Whistle", "quantity": "1 per person", "category": "safety"},
    {"name": "Dust mask", "quantity": "1 per person", "category": "safety"},
    {"name": "Plastic sheeting and duct tape", "quantity": "1 roll each", "category": "safety"},
    {"name": "Moist towelettes", "quantity": "1 pack", "category": "comfort"},
    {"name": "Garbage bags", "quantity": "1 roll", "category": "comfort"},
    {"name": "Important documents (ID, insurance)", "quantity": "Copies in waterproof bag", "category": "other"},
    {"name": "Cash (small bills)", "quantity": "$100–200", "category": "other"},
    {"name": "Cell phone with chargers", "quantity": "1 per adult", "category": "comfort"},
    {"name": "Power bank", "quantity": "1", "category": "comfort"},
]

_CHILDREN_SUPPLIES: list[dict] = [
    {"name": "Baby formula and diapers", "quantity": "3-day supply", "category": "comfort"},
    {"name": "Baby wipes", "quantity": "1 large pack", "category": "comfort"},
    {"name": "Children's medications", "quantity": "Age-appropriate supply", "category": "medical"},
    {"name": "Comfort items (toys, blanket)", "quantity": "1–2 items per child", "category": "comfort"},
    {"name": "Books or activities", "quantity": "Per child", "category": "comfort"},
]

_ELDERLY_SUPPLIES: list[dict] = [
    {"name": "Prescription medications (2-week supply)", "quantity": "As prescribed", "category": "medical"},
    {"name": "Hearing aids with extra batteries", "quantity": "1 set + extras", "category": "medical"},
    {"name": "Glasses/contact lenses", "quantity": "Backup pair", "category": "medical"},
    {"name": "Mobility aids (walker, cane)", "quantity": "As needed", "category": "safety"},
    {"name": "Incontinence supplies", "quantity": "As needed", "category": "comfort"},
]

_PET_SUPPLIES: list[dict] = [
    {"name": "Pet food (3-day supply)", "quantity": "3 days per pet", "category": "pet"},
    {"name": "Water for pets", "quantity": "1 gallon/day per pet", "category": "pet"},
    {"name": "Leash, collar, and harness", "quantity": "1 per pet", "category": "pet"},
    {"name": "Pet carrier or crate", "quantity": "1 per pet", "category": "pet"},
    {"name": "Vaccination records", "quantity": "Copies", "category": "pet"},
    {"name": "Pet medications", "quantity": "2-week supply", "category": "pet"},
    {"name": "Familiar blanket or toy", "quantity": "Per pet", "category": "pet"},
]

_MEDICAL_CONDITION_SUPPLIES: list[dict] = [
    {"name": "Prescription medications (2-week supply)", "quantity": "As prescribed", "category": "medical"},
    {"name": "Medical alert bracelet/ID", "quantity": "1 per person with condition", "category": "medical"},
    {"name": "Blood sugar monitor and supplies", "quantity": "As needed", "category": "medical"},
    {"name": "Blood pressure monitor", "quantity": "1", "category": "medical"},
    {"name": "Medical device backup power", "quantity": "Batteries/charger for CPAP/oxygen", "category": "medical"},
]


def emergency_supply_list(household_profile: dict) -> dict:
    """Generate a tailored emergency supply checklist based on household profile.

    The output is assembled from base supplies plus conditional sections
    activated by the profile flags (children, elderly, pets, medical conditions).
    """
    profile = HouseholdProfile(**household_profile)

    items: list[SupplyItem] = [SupplyItem(**i) for i in _BASE_SUPPLIES]

    notes: list[str] = []

    if profile.num_children > 0:
        items.extend(SupplyItem(**i) for i in _CHILDREN_SUPPLIES)
        notes.append(f"Child-specific items added for {profile.num_children} child(ren).")

    if profile.num_elderly > 0:
        items.extend(SupplyItem(**i) for i in _ELDERLY_SUPPLIES)
        notes.append(f"Elderly-specific items added for {profile.num_elderly} elderly person/people.")

    if profile.num_pets > 0:
        items.extend(SupplyItem(**i) for i in _PET_SUPPLIES)
        notes.append(f"Pet-specific items added for {profile.num_pets} pet(s).")

    if profile.has_medical_conditions:
        items.extend(SupplyItem(**i) for i in _MEDICAL_CONDITION_SUPPLIES)
        conditions = ", ".join(profile.specific_conditions) if profile.specific_conditions else "specified conditions"
        notes.append(f"Medical-condition-specific items added for: {conditions}.")

    out = EmergencySupplyListOutput(
        items=items,
        note=" | ".join(notes) if notes else "Standard household supply list.",
    )
    return out.model_dump()
