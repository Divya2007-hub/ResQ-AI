"""Landing page — project pitch and call to action.

Shows the ResQ AI value proposition, a 3-step "how it works" visual,
and a prominent Start button that navigates to the emergency form.
"""

import streamlit as st


def render_landing() -> None:
    from utils.state import render_page_indicator
    render_page_indicator("landing")
    """Render the landing page with pitch, steps, and start button."""
    st.markdown(
        """
        <style>
        .landing-container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
            padding-top: 2rem;
        }
        .landing-badge {
            display: inline-block;
            background: #10b98120;
            color: #10b981;
            padding: 0.3rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .landing-title {
            font-size: 2.8rem;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.15;
            margin-bottom: 0.5rem;
        }
        .landing-title span {
            color: #2563eb;
        }
        .landing-subtitle {
            font-size: 1.15rem;
            color: #475569;
            max-width: 600px;
            margin: 0 auto 2rem;
            line-height: 1.6;
        }
        .steps-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
            margin: 2.5rem 0;
        }
        .step-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            flex: 1;
            min-width: 200px;
            max-width: 240px;
            text-align: center;
        }
        .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #2563eb;
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
        }
        .step-card h3 {
            font-size: 1rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.4rem;
        }
        .step-card p {
            font-size: 0.85rem;
            color: #64748b;
            margin: 0;
        }
        .feature-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
            margin: 2rem 0 1.5rem;
        }
        .feature-tag {
            background: #eef2ff;
            color: #4338ca;
            padding: 0.35rem 0.9rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        .stButton > button {
            background: linear-gradient(135deg, #2563eb, #0d9488);
            color: white;
            border: none;
            padding: 0.75rem 2.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 10px;
            transition: all 0.2s;
        }
        .stButton > button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    with st.container():
        st.markdown('<div class="landing-container">', unsafe_allow_html=True)

        st.markdown(
            '<div class="landing-badge">🏆 Kaggle AI Agents Competition</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="landing-title">'
            'ResQ <span>AI</span>'
            '</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="landing-subtitle">'
            "When disaster strikes, ResQ AI's team of specialist AI agents triages, "
            "plans, and coordinates a personalised emergency response in seconds — "
            "and shows you exactly how they reasoned to get there."
            '</div>',
            unsafe_allow_html=True,
        )

        # 3-step how it works
        st.markdown(
            '<div class="steps-container">'
            '<div class="step-card">'
            '<div class="step-number">1</div>'
            '<h3>Describe Your Situation</h3>'
            '<p>Tell us what\'s happening — flood, earthquake, fire, or any emergency.</p>'
            '</div>'
            '<div class="step-card">'
            '<div class="step-number">2</div>'
            '<h3>AI Agents Take Over</h3>'
            '<p>A team of specialist agents triage, plan, and coordinate your response.</p>'
            '</div>'
            '<div class="step-card">'
            '<div class="step-number">3</div>'
            '<h3>Get Your Action Plan</h3>'
            '<p>A prioritised emergency plan with safety steps, medical advice, and more.</p>'
            '</div>'
            '</div>',
            unsafe_allow_html=True,
        )

        # Feature tags
        st.markdown(
            '<div class="feature-list">'
            '<span class="feature-tag">🧠 Multi-Agent Reasoning</span>'
            '<span class="feature-tag">🔍 Live Agent Trace</span>'
            '<span class="feature-tag">🛡️ Security Demo</span>'
            '<span class="feature-tag">📋 PDF Report</span>'
            '<span class="feature-tag">📱 Tap-to-Copy</span>'
            '</div>',
            unsafe_allow_html=True,
        )

        # Start button
        if st.button("🚀 Start Emergency Response", use_container_width=True, type="primary"):
            st.session_state.page = "form"
            st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)
