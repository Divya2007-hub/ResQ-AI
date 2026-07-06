"""Input validation helpers for the Streamlit forms.

Ensures user inputs meet basic quality standards before being sent to the
agent pipeline.
"""

from typing import Any


def validate_emergency_form(form_data: dict) -> list[str]:
    """Validate the emergency form data and return a list of error messages.

    Returns an empty list if all validations pass.
    """
    errors: list[str] = []

    # Location
    location = (form_data.get("location") or "").strip()
    if not location:
        errors.append("Location is required.")
    elif len(location) < 2:
        errors.append("Location must be at least 2 characters.")
    elif len(location) > 200:
        errors.append("Location is too long (max 200 characters).")

    # Description
    description = (form_data.get("description") or "").strip()
    if not description:
        errors.append("Please describe the emergency situation.")
    elif len(description) < 10:
        errors.append("Please provide a more detailed description (at least 10 characters).")
    elif len(description) > 5000:
        errors.append("Description is too long (max 5000 characters).")

    # Number of people
    num_adults = form_data.get("num_adults", 0)
    if not isinstance(num_adults, int) or num_adults < 0 or num_adults > 100:
        errors.append("Number of adults must be between 0 and 100.")

    num_children = form_data.get("num_children", 0)
    if not isinstance(num_children, int) or num_children < 0 or num_children > 50:
        errors.append("Number of children must be between 0 and 50.")

    num_elderly = form_data.get("num_elderly", 0)
    if not isinstance(num_elderly, int) or num_elderly < 0 or num_elderly > 50:
        errors.append("Number of elderly must be between 0 and 50.")

    num_pets = form_data.get("num_pets", 0)
    if not isinstance(num_pets, int) or num_pets < 0 or num_pets > 50:
        errors.append("Number of pets must be between 0 and 50.")

    total_people = num_adults + num_children + num_elderly
    if total_people < 1:
        errors.append("At least 1 person must be in the household.")

    return errors


def check_rate_limit(max_requests: int = 20) -> tuple[bool, int]:
    """Check if the current session has exceeded the rate limit.

    Returns (is_allowed, remaining_requests).
    """
    import time
    from config.settings import RATE_LIMIT_MAX_REQUESTS

    limit = max_requests if max_requests != 20 else RATE_LIMIT_MAX_REQUESTS
    import streamlit as st

    count = st.session_state.get("rate_limit_count", 0)
    reset_time = st.session_state.get("rate_limit_reset", 0.0)
    now = time.time()

    # Reset counter every hour
    if now - reset_time > 3600:
        count = 0
        st.session_state.rate_limit_reset = now

    remaining = max(0, limit - count)
    if count >= limit:
        return False, remaining

    return True, remaining


def increment_rate_limit() -> None:
    """Increment the rate limit counter for the current session."""
    import streamlit as st

    count = st.session_state.get("rate_limit_count", 0)
    st.session_state.rate_limit_count = count + 1
