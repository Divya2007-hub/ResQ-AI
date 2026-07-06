"""ResQ AI — Multi-Agent Disaster Response & Emergency Assistant.

Main Streamlit application entry point. Manages page routing and
coordinates the agent pipeline execution with the UI.
"""

import streamlit as st

from utils.state import init_session_state, reset_session
from utils.validators import check_rate_limit
from config.settings import APP_NAME, APP_TAGLINE, APP_VERSION, validate

# Page config — must be the first Streamlit command
st.set_page_config(
    page_title=APP_NAME,
    page_icon="🆘",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Global styles ──────────────────────────────────────────────────────

st.markdown(
    """
    <style>
    /* Base reset */
    .main > div {
        padding-top: 1rem;
    }
    .stApp {
        background: #f8fafc;
    }
    /* Typography */
    h1, h2, h3, h4 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    /* Sidebar hide */
    #MainMenu {visibility: hidden;}
    .stDeployButton {display: none;}
    footer {visibility: hidden;}

    /* Card component */
    .card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }

    /* Severity badges */
    .sev-1 { background: #d1fae5; color: #065f46; }
    .sev-2 { background: #a7f3d0; color: #065f46; }
    .sev-3 { background: #fef9c3; color: #854d0e; }
    .sev-4 { background: #fed7aa; color: #9a3412; }
    .sev-5 { background: #fecaca; color: #991b1b; }

    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(-12px); }
        to   { opacity: 1; transform: translateX(0); }
    }
    .fade-in {
        animation: fadeIn 0.4s ease-out both;
    }
    .slide-in {
        animation: slideIn 0.3s ease-out both;
    }

    /* Scroll margin for anchor targets */
    .anchor {
        scroll-margin-top: 1rem;
    }

    /* Better streamlit overrides */
    div[data-testid="stVerticalBlock"] > div {
        gap: 0.5rem;
    }
    .st-emotion-cache-1r4qj8v {
        padding: 0 1rem;
    }
    @media (max-width: 640px) {
        .st-emotion-cache-1r4qj8v {
            padding: 0 0.5rem;
        }
    }

    /* Progress indicator */
    .page-indicator {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }
    .page-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #e2e8f0;
    }
    .page-dot.active {
        background: #2563eb;
    }
    .page-dot.completed {
        background: #10b981;
    }

    /* Responsive */
    @media (max-width: 640px) {
        .main > div {
            padding-top: 0.5rem;
        }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ── Initialisation ────────────────────────────────────────────────────

init_session_state()

# Validate config
config_errors = validate()
if config_errors:
    for err in config_errors:
        st.error(err)
    st.info(
        "Copy `.env.example` to `.env` and set your GEMINI_API_KEY, then restart the app."
    )
    st.stop()


# ── Sidebar (minimal) ─────────────────────────────────────────────────

with st.sidebar:
    st.markdown(f"**{APP_NAME}** v{APP_VERSION}")
    st.caption(APP_TAGLINE)

    if st.session_state.page != "landing":
        st.divider()
        st.markdown("**Progress**")
        pages = [
            ("landing", "🏠 Home"),
            ("form", "📝 Form"),
            ("security_demo", "🛡️ Security"),
            ("trace", "🧠 Trace"),
            ("results", "📋 Results"),
        ]
        current = st.session_state.page
        for page_key, page_label in pages:
            if page_key == current:
                st.markdown(f"→ **{page_label}**")
            elif pages.index((page_key, page_label)) < pages.index(
                [p for p in pages if p[0] == current][0]
            ):
                st.markdown(f"✅ {page_label}")
            else:
                st.markdown(page_label)

        st.divider()
        if st.button("🔄 Reset All", use_container_width=True):
            reset_session()
            st.rerun()

        st.divider()
        st.caption(
            "⚠️ **Medical disclaimer:** AI-generated guidance only. "
            "Always consult a professional medical practitioner in an emergency."
        )
        st.caption(
            "⚠️ **Emergency disclaimer:** In a real emergency, "
            "always call your local emergency services (911 / 112) first."
        )


# ── Page router ───────────────────────────────────────────────────────

def main() -> None:
    """Route to the appropriate page based on session state."""
    page = st.session_state.page

    if page == "landing":
        from frontend.landing import render_landing
        render_landing()

    elif page == "form":
        from frontend.form import render_form
        render_form()

    elif page == "security_demo":
        from frontend.security_demo import render_security_demo
        render_security_demo()

    elif page == "trace":
        from frontend.trace_view import render_trace
        from agents.pipeline import run_pipeline

        # Check if we need to run the pipeline (first visit to trace page)
        if not st.session_state.pipeline_result:
            form_data = st.session_state.form_data

            if not form_data:
                st.error("No form data found. Please fill out the emergency form first.")
                st.session_state.page = "form"
                st.rerun()
                return

            # Rate limit check
            allowed, remaining = check_rate_limit()
            if not allowed:
                st.error(
                    f"Rate limit exceeded. Please wait before submitting another request."
                )
                st.session_state.page = "form"
                st.rerun()
                return

            # Build household profile
            household_profile = {
                "num_adults": form_data.get("num_adults", 1),
                "num_children": form_data.get("num_children", 0),
                "num_elderly": form_data.get("num_elderly", 0),
                "num_pets": form_data.get("num_pets", 0),
                "has_medical_conditions": form_data.get("has_medical_conditions", False),
                "specific_conditions": form_data.get("specific_conditions", []),
            }

            user_input = form_data.get("description", "")
            disaster_type = form_data.get("disaster_type", "unknown")
            location = form_data.get("location", "Unknown")
            security_mode = st.session_state.get("security_test_mode", False)

            # Show a spinner while running
            with st.spinner("🧠 AI agents are analysing your situation..."):
                result = run_pipeline(
                    user_input=user_input,
                    disaster_type=disaster_type,
                    location=location,
                    household_profile=household_profile,
                    security_test_mode=security_mode,
                )

            st.session_state.pipeline_result = result.final_plan
            st.session_state.trace_events = result.trace
            st.session_state.sanitization_result = result.sanitization_result

            if result.error:
                st.session_state.error_message = result.error
                st.error(f"Pipeline error: {result.error}")
                st.session_state.page = "form"
                st.rerun()
                return

            # Auto-advance to results
            st.session_state.page = "results"
            st.rerun()
        else:
            # Already have results — go straight to results page
            st.session_state.page = "results"
            st.rerun()

        # Render trace (in case we stay here)
        render_trace()

    elif page == "results":
        from frontend.results import render_results

        if not st.session_state.pipeline_result:
            st.warning("No results yet. Please start from the beginning.")
            st.session_state.page = "landing"
            st.rerun()
            return

        render_results()

    else:
        st.error(f"Unknown page: {page}")
        st.session_state.page = "landing"
        st.rerun()


if __name__ == "__main__":
    main()
