"""Results page — the final emergency plan.

Displays: Priority Level badge, Immediate Safety Steps, Medical Advice,
Supply Checklist, Communication Drafts (tap-to-copy), Recovery Checklist,
Download Report (PDF), Reset button.
"""

import streamlit as st
from utils.pdf_export import generate_pdf


def _copy_code(text: str, label: str) -> None:
    """Show a code block with built-in copy button (Streamlit 1.38+)."""
    st.code(text, language="text", line_numbers=False)


def render_results() -> None:
    """Render the final emergency plan results page."""
    from utils.state import render_page_indicator
    render_page_indicator("results")
    st.markdown(
        """
        <style>
        .results-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.25rem;
        }
        .results-subtitle {
            color: #64748b;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }
        .priority-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-weight: 700;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        .priority-badge.critical {
            background: #fee2e2;
            color: #991b1b;
        }
        .priority-badge.severe {
            background: #ffedd5;
            color: #9a3412;
        }
        .priority-badge.moderate {
            background: #fef9c3;
            color: #854d0e;
        }
        .priority-badge.low {
            background: #d1fae5;
            color: #065f46;
        }
        .section-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1rem;
        }
        .section-card h3 {
            font-size: 1rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .step-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.9rem;
            color: #334155;
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
        }
        .step-item:last-child {
            border-bottom: none;
        }
        .step-item .step-num {
            background: #2563eb;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 0.1rem;
        }
        .copy-btn {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.25rem 0.6rem;
            font-size: 0.75rem;
            color: #475569;
            cursor: pointer;
            float: right;
        }
        .supply-category {
            font-weight: 600;
            color: #2563eb;
            font-size: 0.85rem;
            margin-top: 0.5rem;
            text-transform: capitalize;
        }
        .msg-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            font-family: monospace;
            color: #334155;
            margin-bottom: 0.5rem;
            white-space: pre-wrap;
            position: relative;
        }
        .disclaimer-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
            color: #92400e;
            margin-bottom: 1rem;
        }
        .action-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    plan = st.session_state.pipeline_result
    if not plan:
        st.error("No emergency plan found. Please start from the beginning.")
        if st.button("← Start Over"):
            st.session_state.page = "landing"
            st.rerun()
        return

    trace = st.session_state.trace_events

    # Header
    col1, col2 = st.columns([0.7, 0.3])
    with col1:
        st.markdown('<div class="results-title">📋 Your Emergency Action Plan</div>', unsafe_allow_html=True)
    with col2:
        if st.button("← New Response", use_container_width=True):
            st.session_state.page = "form"
            st.rerun()

    # Priority badge — prominent, animated
    severity = plan.get("severity_score", 3)
    priority = plan.get("priority_level", "moderate")
    pclass = {"critical": "critical", "severe": "severe", "moderate": "moderate", "low": "low"}.get(
        priority, "moderate"
    )
    icons = {"critical": "🔴", "severe": "🟠", "moderate": "🟡", "low": "🟢"}
    st.markdown(
        f'<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">'
        f'<div class="priority-badge {pclass}" style="animation:fadeIn 0.5s ease-out;">'
        f'{icons.get(priority, "🟡")} '
        f'{priority.upper()} — Severity {severity}/5'
        f'</div>'
        f'<span style="font-size:0.85rem;color:#64748b;">'
        f'Generated at {__import__("datetime").datetime.now().strftime("%H:%M:%S")}'
        f'</span>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # Key metrics row
    met_cols = st.columns(4)
    safety_count = len(plan.get("immediate_safety_steps", []))
    medical_count = len(plan.get("medical_advice", []))
    supply_count = len(plan.get("supply_checklist", []))
    recovery_count = len(plan.get("recovery_checklist", []))
    metrics = [
        ("🚨 Safety Steps", safety_count, "#2563eb"),
        ("🏥 Medical Items", medical_count, "#0d9488"),
        ("🎒 Supply Items", supply_count, "#d97706"),
        ("🔁 Recovery Steps", recovery_count, "#7c3aed"),
    ]
    for col, (label, count, color) in zip(met_cols, metrics):
        with col:
            st.markdown(
                f'<div style="background:white;border:1px solid #e2e8f0;border-radius:10px;'
                f'padding:0.75rem;text-align:center;">'
                f'<div style="font-size:1.3rem;font-weight:800;color:{color};">{count}</div>'
                f'<div style="font-size:0.75rem;color:#64748b;">{label}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

    # Disclaimers
    for disclaimer in plan.get("disclaimers", []):
        st.markdown(f'<div class="disclaimer-note">⚠️ {disclaimer}</div>', unsafe_allow_html=True)

    # ── Immediate Safety Steps ──
    safety_steps = plan.get("immediate_safety_steps", [])
    if safety_steps:
        st.markdown(
            '<div class="section-card"><h3>🚨 Immediate Safety Steps</h3>',
            unsafe_allow_html=True,
        )
        for i, step in enumerate(safety_steps, 1):
            st.markdown(
                f'<div class="step-item"><span class="step-num">{i}</span> {step}</div>',
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Medical Advice ──
    medical = plan.get("medical_advice", [])
    if medical:
        st.markdown(
            '<div class="section-card"><h3>🏥 Medical Advice</h3>',
            unsafe_allow_html=True,
        )
        for i, advice in enumerate(medical, 1):
            st.markdown(
                f'<div class="step-item"><span class="step-num">{i}</span> {advice}</div>',
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Supply Checklist ──
    supply_items = plan.get("supply_checklist", [])
    if supply_items:
        st.markdown(
            '<div class="section-card"><h3>🎒 Supply Checklist</h3>',
            unsafe_allow_html=True,
        )
        # Group by category
        categories: dict[str, list] = {}
        for item in supply_items:
            cat = item.get("category", "other")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)

        for category, items in categories.items():
            st.markdown(f'<div class="supply-category">{category}</div>', unsafe_allow_html=True)
            for item in items:
                content = item.get("content", item.get("name", ""))
                st.markdown(f'- {content}')
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Communication Drafts ──
    comms = plan.get("communication_drafts", {})
    if comms:
        st.markdown(
            '<div class="section-card"><h3>📡 Communication Drafts</h3>',
            unsafe_allow_html=True,
        )
        for label, draft in comms.items():
            nice_label = label.replace("_", " ").title()
            st.markdown(f"**{nice_label}**")
            _copy_code(draft, label)
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Recovery Checklist ──
    recovery = plan.get("recovery_checklist", [])
    if recovery:
        st.markdown(
            '<div class="section-card"><h3>🔁 Recovery Checklist</h3>',
            unsafe_allow_html=True,
        )
        for i, step in enumerate(recovery, 1):
            st.markdown(
                f'<div class="step-item"><span class="step-num">{i}</span> {step}</div>',
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    # ── View Full Trace ──
    with st.expander("🧠 View Full Agent Trace", expanded=False):
        for event in trace:
            agent = event.get("agent", "?")
            status = event.get("status", "?")
            summary = event.get("summary", "")
            duration = event.get("duration_ms", 0)
            st.markdown(f"**{agent}** — `{status}` ({duration}ms)")
            st.caption(summary)
            tool_calls = event.get("tool_calls", [])
            if tool_calls:
                for tc in tool_calls:
                    st.code(f"🔧 {tc.get('name')}({tc.get('args', {})})", language="json")
            st.divider()

    # ── Action Buttons ──
    st.markdown('<div class="action-buttons">', unsafe_allow_html=True)

    # Generate PDF bytes once — single-click download
    pdf_bytes = generate_pdf(plan, trace)

    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.download_button(
            "📄 Download PDF Report",
            data=pdf_bytes,
            file_name="resq_ai_emergency_plan.pdf",
            mime="application/pdf",
            use_container_width=True,
        )
    with col_b:
        if st.button("🔄 Start Over", use_container_width=True):
            from utils.state import reset_session
            reset_session()
            st.rerun()
    with col_c:
        if st.button("📝 New Form", use_container_width=True):
            st.session_state.page = "form"
            st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)



