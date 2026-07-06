"""First-aid guidance tool — MCP-exposed.

Why MCP and not hardcoded:
  Medical guidance must be centrally auditable and version-controlled.
  Embedding first-aid instructions in an agent prompt makes them invisible
  to review and hard to update. With an MCP tool, the guidance lives in a
  single place, can be reviewed by domain experts, and the Medical Agent
  simply calls it — clean separation of concerns.
  The explicit disclaimer is non-negotiable and returned with every response.
"""

from mcp.tool_schemas import (
    GetFirstAidInput,
    GetFirstAidOutput,
    FirstAidStep,
)

# Structured first-aid data — one source of truth.
_FIRST_AID: dict[str, list[dict]] = {
    "bleeding": [
        {"step_number": 1, "instruction": "Put on disposable gloves if available.", "warning": "Protect yourself from bloodborne pathogens."},
        {"step_number": 2, "instruction": "Apply direct pressure to the wound using a clean cloth or sterile gauze.", "warning": "Do not remove objects embedded in the wound."},
        {"step_number": 3, "instruction": "Elevate the injured area above the heart if possible.", "warning": "Do not elevate if you suspect a fracture."},
        {"step_number": 4, "instruction": "Apply a pressure bandage and secure it firmly.", "warning": "Do not wrap so tightly that it cuts off circulation."},
        {"step_number": 5, "instruction": "Seek professional medical help immediately if bleeding is severe or does not stop.", "warning": ""},
    ],
    "burn": [
        {"step_number": 1, "instruction": "Cool the burn under cool (not cold) running water for at least 10 minutes.", "warning": "Do not use ice — it can damage tissue further."},
        {"step_number": 2, "instruction": "Remove jewellery or tight items near the burn before swelling starts.", "warning": ""},
        {"step_number": 3, "instruction": "Cover the burn loosely with a sterile gauze or clean cloth.", "warning": "Do not apply butter, toothpaste, or ointments."},
        {"step_number": 4, "instruction": "Take over-the-counter pain relief if available and needed.", "warning": ""},
        {"step_number": 5, "instruction": "Seek emergency care for large, deep, or facial burns.", "warning": "Third-degree burns always require medical attention."},
    ],
    "fracture": [
        {"step_number": 1, "instruction": "Keep the injured person still and calm.", "warning": "Do not move them if you suspect a spinal injury."},
        {"step_number": 2, "instruction": "Immobilise the injured area using a splint or sling.", "warning": "Splint the joint above and below the fracture."},
        {"step_number": 3, "instruction": "Apply a cold pack wrapped in cloth to reduce swelling.", "warning": "Do not apply ice directly to the skin."},
        {"step_number": 4, "instruction": "Check for circulation beyond the injury (pulse, sensation, movement).", "warning": ""},
        {"step_number": 5, "instruction": "Transport to a medical facility as soon as possible.", "warning": "Call emergency services for suspected hip, neck, or back fractures."},
    ],
    "choking": [
        {"step_number": 1, "instruction": "Ask the person: 'Are you choking?' If they cannot speak or cough, act immediately.", "warning": ""},
        {"step_number": 2, "instruction": "Stand behind the person and perform abdominal thrusts (Heimlich manoeuvre).", "warning": "Do not perform on infants under 1 year — use back blows instead."},
        {"step_number": 3, "instruction": "Place your fist above their navel, grasp with other hand, and thrust inward and upward.", "warning": ""},
        {"step_number": 4, "instruction": "Repeat until the object is expelled or the person becomes unconscious.", "warning": ""},
        {"step_number": 5, "instruction": "If unconscious, lower them to the ground and start CPR. Call emergency services.", "warning": ""},
    ],
    "heart attack": [
        {"step_number": 1, "instruction": "Call emergency services immediately.", "warning": "Every minute matters during a heart attack."},
        {"step_number": 2, "instruction": "Have the person sit down, rest, and stay calm.", "warning": "Do not let them lie down if they are short of breath."},
        {"step_number": 3, "instruction": "Help them take aspirin (325 mg) if they are not allergic and not on blood thinners.", "warning": "Do not give aspirin if they have a bleeding condition or suspect a stroke."},
        {"step_number": 4, "instruction": "If available and prescribed, help them take nitroglycerin.", "warning": ""},
        {"step_number": 5, "instruction": "If they become unconscious and unresponsive, start CPR immediately.", "warning": "Hands-only CPR (100–120 compressions per minute) is effective."},
    ],
    "shock": [
        {"step_number": 1, "instruction": "Call emergency services.", "warning": ""},
        {"step_number": 2, "instruction": "Have the person lie down on their back and elevate their legs about 12 inches.", "warning": "Do not elevate if head, neck, or spinal injury is suspected."},
        {"step_number": 3, "instruction": "Keep them warm with a blanket or coat.", "warning": ""},
        {"step_number": 4, "instruction": "Do not give them anything to eat or drink.", "warning": "They may need surgery and anaesthesia."},
        {"step_number": 5, "instruction": "Monitor their breathing and consciousness until help arrives.", "warning": ""},
    ],
    "hypothermia": [
        {"step_number": 1, "instruction": "Move the person to a warm, dry environment.", "warning": "Handle them gently — rough movement can trigger cardiac arrest."},
        {"step_number": 2, "instruction": "Remove wet clothing and replace with dry layers.", "warning": ""},
        {"step_number": 3, "instruction": "Warm the core first — chest, neck, and groin area — using warm compresses or body heat.", "warning": "Do not warm arms and legs first — it pushes cold blood to the heart."},
        {"step_number": 4, "instruction": "Give warm (not hot) beverages if the person is conscious and able to swallow.", "warning": "No alcohol or caffeine."},
        {"step_number": 5, "instruction": "If unresponsive or not breathing, start CPR and call emergency services.", "warning": ""},
    ],
}


def get_first_aid(condition: str) -> dict:
    """Retrieve step-by-step first-aid instructions for a given condition.

    If the condition is not recognised, returns a helpful fallback message
    advising the user to call emergency services.
    """
    inp = GetFirstAidInput(condition=condition)
    key = inp.condition.lower().strip()

    data = _FIRST_AID.get(key)
    if data is None:
        # Fallback: try a partial match
        for known_key, steps in _FIRST_AID.items():
            if known_key in key or key in known_key:
                data = steps
                break

    if data is None:
        return GetFirstAidOutput(
            condition=inp.condition,
            steps=[
                FirstAidStep(
                    step_number=1,
                    instruction=(
                        f"'{inp.condition}' is not a condition we have guidance for. "
                        "Please call emergency services immediately."
                    ),
                    warning="Do not delay — contact a medical professional.",
                )
            ],
        ).model_dump()

    steps = [FirstAidStep(**s) for s in data]
    out = GetFirstAidOutput(condition=key, steps=steps)
    return out.model_dump()
