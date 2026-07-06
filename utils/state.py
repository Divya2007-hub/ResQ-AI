"""Session state management for the Streamlit app.

Centralises all session state keys and initialisation so they are defined
in one place rather than scattered across frontend modules.
"""

import streamlit as st
from typing import Any


# Default values for all session state keys
_DEFAULTS: dict[str, Any] = {
    "page": "landing",
    "form_data": {},
    "pipeline_result": None,
    "trace_events": [],
    "security_test_mode": False,
    "sanitization_result": None,
    "security_test_result": None,
    "rate_limit_count": 0,
    "rate_limit_reset": 0.0,
    "show_disclaimer": True,
    "error_message": None,
}


def init_session_state() -> None:
    """Initialise all session state keys to their defaults if not already set."""
    for key, value in _DEFAULTS.items():
        if key not in st.session_state:
            st.session_state[key] = value


def render_page_indicator(current: str) -> None:
    """Render a small visual progress bar showing which step the user is on."""
    steps = [
        ("landing", "🏠"),
        ("form", "📝"),
        ("trace", "🧠"),
        ("results", "📋"),
    ]
    labels = {
        "landing": "Start",
        "form": "Form",
        "trace": "Analysis",
        "results": "Plan",
    }
    html_parts: list[str] = []
    found_current = False
    for key, icon in steps:
        if key == current:
            found_current = True
            html_parts.append(
                f'<span style="display:inline-flex;align-items:center;gap:4px;'
                f'background:#2563eb;color:white;padding:3px 12px;border-radius:12px;'
                f'font-size:0.75rem;font-weight:600;">{icon} {labels[key]}</span>'
            )
        elif not found_current:
            html_parts.append(
                f'<span style="display:inline-flex;align-items:center;gap:4px;'
                f'color:#10b981;font-size:0.75rem;">✅ {labels[key]}</span>'
            )
        else:
            html_parts.append(
                f'<span style="display:inline-flex;align-items:center;gap:4px;'
                f'color:#cbd5e1;font-size:0.75rem;">{icon} {labels[key]}</span>'
            )
        if key != steps[-1][0]:
            html_parts.append(
                f'<span style="color:#e2e8f0;font-size:0.7rem;">▸</span>'
            )

    import streamlit as st
    st.markdown(
        f'<div style="display:flex;align-items:center;gap:6px;margin-bottom:1rem;'
        f'flex-wrap:wrap;">{" ".join(html_parts)}</div>',
        unsafe_allow_html=True,
    )


def reset_session() -> None:
    """Reset all session state (user data only, not UI preferences)."""
    keys_to_reset = [
        "form_data",
        "pipeline_result",
        "trace_events",
        "sanitization_result",
        "error_message",
        "rate_limit_count",
    ]
    for key in keys_to_reset:
        st.session_state[key] = _DEFAULTS[key]
    st.session_state.page = "landing"
