"""Supply Agent — emergency kit checklist parameterised by household profile.

Role:
  Generates a dynamic emergency supply checklist based on the household composition
  (adults, children, elderly, pets, medical conditions). The checklist is tailored
  to the specific needs of the household.

System prompt:
  The agent receives the household profile from state and calls the
  emergency_supply_list tool with the profile. Results are organised by category.

Tool bindings:
  - emergency_supply_list (MCP): returns items categorised by type.
  - check_offline_cache (MCP): fallback.

Output schema:
  SupplyOutput — items_by_category[], total_items, note.
"""

from google.adk.agents import Agent
from mcp.server import call_tool
from pydantic import BaseModel, Field


class SupplyItem(BaseModel):
    """A single supply item."""
    name: str = Field(description="Item name")
    quantity: str = Field(description="Recommended quantity")
    category: str = Field(description="Category: food, water, medical, safety, comfort, pet, other")


class SupplyOutput(BaseModel):
    """Structured output from the Supply Agent."""
    items_by_category: dict[str, list[SupplyItem]] = Field(
        default_factory=dict,
        description="Supplies grouped by category"
    )
    total_items: int = Field(default=0, description="Total number of items")
    note: str = Field(default="", description="Any additional notes about the supply list")


# ── Tool wrappers ──────────────────────────────────────────────────────

def emergency_supply_list_tool(household_profile: dict) -> dict:
    """Generate a tailored emergency supply checklist.

    Args:
        household_profile: Dict with num_adults, num_children, num_elderly,
            num_pets, has_medical_conditions, specific_conditions.

    Returns:
        A dict with 'items' (list of {name, quantity, category}) and 'note'.
    """
    return call_tool("emergency_supply_list", household_profile=household_profile)


def offline_fallback_tool(query: str) -> dict:
    """Look up supply information from offline cache.

    Args:
        query: Query string for the cache.

    Returns:
        Cached data dict.
    """
    return call_tool("check_offline_cache", query=query)


# ── Agent definition ───────────────────────────────────────────────────

supply_agent = Agent(
    name="SupplyAgent",
    model="gemini-2.0-flash",
    instruction=(
        "You are the Supply Agent in a multi-agent disaster response system.\n"
        "\n"
        "Input (from state):\n"
        "- household_profile: num_adults, num_children, num_elderly, num_pets, "
        "has_medical_conditions, specific_conditions\n"
        "- routing_plan: confirms you should run\n"
        "\n"
        "Your job:\n"
        "1. Call `emergency_supply_list_tool` with the household profile.\n"
        "2. If the tool fails, call `offline_fallback_tool` with 'emergency supplies'.\n"
        "3. Organise the returned items by category for readability.\n"
        "4. Output a structured SupplyOutput.\n"
        "\n"
        "Rules:\n"
        "- If num_children is 0, DO NOT include child-specific items.\n"
        "- If num_elderly is 0, DO NOT include elderly-specific items.\n"
        "- If num_pets is 0, DO NOT include pet-specific items.\n"
        "- If no medical conditions, DO NOT include condition-specific medical items.\n"
        "- Always include the base items (water, food, first aid, flashlight, etc.).\n"
        "- Categorise items for easy scanning."
    ),
    description="Generates a tailored emergency supply checklist based on household profile.",
    output_key="supply_result",
    tools=[emergency_supply_list_tool, offline_fallback_tool],
)
