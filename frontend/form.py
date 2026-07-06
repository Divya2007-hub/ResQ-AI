"""Emergency form — collects user situation details.

Fields: disaster type, location, number of people, medical conditions,
available supplies, pets/children/elderly toggles, and a Security Test Mode toggle.
"""

import streamlit as st
from utils.validators import validate_emergency_form, check_rate_limit, increment_rate_limit


DISASTER_OPTIONS = [
    "flood",
    "earthquake",
    "cyclone",
    "landslide",
    "wildfire",
    "tsunami",
    "unknown",
]


def render_form() -> None:
    """Render the emergency intake form."""
    from utils.state import render_page_indicator
    render_page_indicator("form")
    st.markdown(
        """
        <style>
        .form-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.25rem;
        }
        .form-subtitle {
            color: #64748b;
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
        }
        .form-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        .form-card h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .disclaimer-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            color: #92400e;
            margin-bottom: 1rem;
        }
        .security-toggle {
            background: #eef2ff;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    with st.container():
        # Back nav
        col1, col2 = st.columns([0.1, 0.9])
        with col1:
            if st.button("← Back", help="Return to landing page"):
                st.session_state.page = "landing"
                st.rerun()
        with col2:
            st.markdown('<div class="form-title">Emergency Intake Form</div>', unsafe_allow_html=True)

        st.markdown(
            '<div class="form-subtitle">Provide details about your situation so our AI agents '
            'can generate a personalised emergency plan.</div>',
            unsafe_allow_html=True,
        )

        # Disclaimer
        st.markdown(
            '<div class="disclaimer-box">'
            '⚠️ <strong>Emergency disclaimer:</strong> This is AI-generated guidance only. '
            "In a real emergency, always call your local emergency services (911 / 112) first. "
            "Do not delay professional help while using this tool."
            '</div>',
            unsafe_allow_html=True,
        )

        # Security Test Mode toggle
        with st.container():
            st.markdown('<div class="security-toggle">', unsafe_allow_html=True)
            sec_col1, sec_col2 = st.columns([3, 1])
            with sec_col1:
                st.markdown(
                    "**🛡️ Security Test Mode** — Test the prompt-injection defence system. "
                    "When enabled, flagged inputs won't block the pipeline so you can see "
                    "the sanitisation in action."
                )
            with sec_col2:
                st.toggle(
                    "Enable",
                    key="security_test_mode",
                    value=st.session_state.get("security_test_mode", False),
                    label_visibility="collapsed",
                )
            st.markdown('</div>', unsafe_allow_html=True)

        # Security demo launch button
        sec_demo_col1, sec_demo_col2 = st.columns([3, 1])
        with sec_demo_col1:
            st.markdown(
                "**🧪 Try Security Demo** — Launch the interactive prompt-injection "
                "test console with preloaded examples."
            )
        with sec_demo_col2:
            if st.button("🛡️ Launch Demo", use_container_width=True):
                st.session_state.page = "security_demo"
                st.rerun()

        # Rate limit display
        from utils.validators import check_rate_limit
        _allowed, _remaining = check_rate_limit()
        if _remaining <= 5:
            st.warning(f"⚠️ Rate limit: {_remaining} requests remaining this hour.")
        else:
            st.caption(f"Rate limit: {_remaining} requests remaining this hour.")

        # Form
        with st.form(key="emergency_form"):
            # Section 1: Situation
            st.markdown('<div class="form-card"><h3>📍 Situation</h3>', unsafe_allow_html=True)
            col_a, col_b = st.columns(2)
            with col_a:
                disaster_type = st.selectbox(
                    "Disaster type",
                    options=DISASTER_OPTIONS,
                    index=0,
                    help="Select the type of disaster you are experiencing.",
                )
            with col_b:
                location = st.text_input(
                    "Your location",
                    placeholder="e.g. City, District, Landmark",
                    help="Your current city or area.",
                )
            description = st.text_area(
                "Describe the emergency",
                placeholder="What is happening around you? Include details about damage, injuries, hazards, and any urgent concerns...",
                height=120,
                help="Provide as much detail as possible for the AI agents to assess.",
            )
            st.markdown('</div>', unsafe_allow_html=True)

            # Section 2: Household
            st.markdown(
                '<div class="form-card"><h3>👨‍👩‍👧‍👦 Household</h3>',
                unsafe_allow_html=True,
            )
            col_c, col_d, col_e, col_f = st.columns(4)
            with col_c:
                num_adults = st.number_input("Adults", min_value=0, max_value=50, value=1)
            with col_d:
                num_children = st.number_input("Children", min_value=0, max_value=50, value=0)
            with col_e:
                num_elderly = st.number_input("Elderly", min_value=0, max_value=50, value=0)
            with col_f:
                num_pets = st.number_input("Pets", min_value=0, max_value=50, value=0)
            st.markdown('</div>', unsafe_allow_html=True)

            # Section 3: Medical
            st.markdown(
                '<div class="form-card"><h3>💊 Medical</h3>',
                unsafe_allow_html=True,
            )
            has_medical = st.checkbox("Anyone with medical conditions requiring attention?")
            specific_conditions = ""
            if has_medical:
                specific_conditions = st.text_input(
                    "List conditions (e.g. diabetes, asthma, heart condition)",
                    placeholder="Separate with commas",
                )
            st.markdown('</div>', unsafe_allow_html=True)

            # Section 4: Available supplies
            st.markdown(
                '<div class="form-card"><h3>🎒 Available Supplies</h3>',
                unsafe_allow_html=True,
            )
            available_supplies = st.text_area(
                "What supplies do you already have?",
                placeholder="e.g. first aid kit, bottled water, flashlight, batteries",
                height=80,
            )
            st.markdown('</div>', unsafe_allow_html=True)

            # Submit
            submitted = st.form_submit_button(
                "🚀 Generate Emergency Plan",
                use_container_width=True,
                type="primary",
            )

    if submitted:
        form_data = {
            "disaster_type": disaster_type,
            "location": location.strip(),
            "description": description.strip(),
            "num_adults": num_adults,
            "num_children": num_children,
            "num_elderly": num_elderly,
            "num_pets": num_pets,
            "has_medical_conditions": has_medical,
            "specific_conditions": [
                c.strip() for c in specific_conditions.split(",") if c.strip()
            ],
            "available_supplies": available_supplies.strip(),
        }

        # Validate
        errors = validate_emergency_form(form_data)
        if errors:
            for err in errors:
                st.error(err)
            return

        # Rate limit check
        allowed, remaining = check_rate_limit()
        if not allowed:
            st.error(
                f"Rate limit exceeded. Please wait before submitting another request. "
                f"Remaining: {remaining}"
            )
            return

        # Store and proceed
        increment_rate_limit()
        st.session_state.form_data = form_data
        st.session_state.page = "trace"
        st.rerun()
