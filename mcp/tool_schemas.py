"""Pydantic schemas for every MCP tool input and output.

Centralising schemas here ensures that:
- All agents consume the same shapes (deterministic merging in the Synthesizer).
- Validation is automatic via Pydantic.
- A single source of truth exists for every tool contract.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Literal


# ─────────────────────────── classify_severity ───────────────────────────

DisasterType = Literal[
    "flood", "earthquake", "cyclone", "landslide", "wildfire", "tsunami", "unknown"
]


class ClassifySeverityInput(BaseModel):
    disaster_type: DisasterType = Field(description="Type of disaster event")
    description: str = Field(
        min_length=10, max_length=2000,
        description="Free-text description of the situation"
    )


class ClassifySeverityOutput(BaseModel):
    severity: int = Field(ge=1, le=5, description="Severity rating 1 (low) – 5 (critical)")
    hazards: list[str] = Field(
        default_factory=list,
        description="Identified hazards e.g. ['downed power lines', 'chemical spill']"
    )
    reasoning: str = Field(description="Brief explanation of the severity classification")


# ─────────────────────────── get_disaster_checklist ──────────────────────

class GetDisasterChecklistInput(BaseModel):
    disaster_type: DisasterType
    severity: int = Field(ge=1, le=5)


class ChecklistItem(BaseModel):
    priority: Literal["immediate", "high", "medium", "low"]
    action: str
    details: str = ""


class GetDisasterChecklistOutput(BaseModel):
    checklist: list[ChecklistItem]


# ─────────────────────────── get_first_aid ───────────────────────────────

class GetFirstAidInput(BaseModel):
    condition: str = Field(
        min_length=1, max_length=200,
        description="Medical condition or injury e.g. 'bleeding', 'burn', 'fracture'"
    )


class FirstAidStep(BaseModel):
    step_number: int
    instruction: str
    warning: str = ""


class GetFirstAidOutput(BaseModel):
    condition: str
    steps: list[FirstAidStep]
    disclaimer: str = (
        "This is AI-generated guidance only. "
        "Always consult a professional medical practitioner in an emergency."
    )


# ─────────────────────────── emergency_supply_list ───────────────────────

class HouseholdProfile(BaseModel):
    num_adults: int = Field(ge=0, default=1)
    num_children: int = Field(ge=0, default=0)
    num_elderly: int = Field(ge=0, default=0)
    num_pets: int = Field(ge=0, default=0)
    has_medical_conditions: bool = False
    specific_conditions: list[str] = Field(default_factory=list)


class SupplyItem(BaseModel):
    name: str
    quantity: str
    category: Literal["food", "water", "medical", "safety", "comfort", "pet", "other"]


class EmergencySupplyListOutput(BaseModel):
    items: list[SupplyItem]
    note: str = ""


# ─────────────────────────── generate_emergency_sms ──────────────────────

class GenerateSmsInput(BaseModel):
    recipient_name: str = Field(max_length=50)
    location: str = Field(max_length=100)
    disaster_type: DisasterType
    severity: int = Field(ge=1, le=5)
    status_message: str = Field(max_length=200, default="I am safe for now.")

    @field_validator("recipient_name", "location")
    @classmethod
    def no_newlines(cls, v: str) -> str:
        return v.replace("\n", " ").replace("\r", " ")


class GenerateSmsOutput(BaseModel):
    sms_text: str = Field(max_length=160)
    char_count: int


# ─────────────────────────── generate_family_message ─────────────────────

class GenerateFamilyMessageInput(BaseModel):
    location: str = Field(max_length=100)
    disaster_type: DisasterType
    severity: int = Field(ge=1, le=5)
    family_members: list[str] = Field(default_factory=list)
    additional_info: str = Field(max_length=500, default="")


class GenerateFamilyMessageOutput(BaseModel):
    message: str
    tone: Literal["reassuring", "urgent", "informational"]


# ─────────────────────────── sanitize_input ──────────────────────────────

class SanitizeInput(BaseModel):
    raw_text: str = Field(min_length=1, max_length=5000)


class SanitizeOutput(BaseModel):
    clean_text: str
    flagged: bool
    reason: str


# ─────────────────────────── check_offline_cache ─────────────────────────

class CheckOfflineCacheInput(BaseModel):
    query: str = Field(
        min_length=1, max_length=200,
        description="A query string (e.g. 'earthquake first aid') to look up locally"
    )


class CheckOfflineCacheOutput(BaseModel):
    found: bool
    source: Literal["cache", "default_fallback"]
    data: dict
