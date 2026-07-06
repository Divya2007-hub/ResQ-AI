"""Live Agent Trace — the centrepiece UI screen.

Shows each agent activating in sequence with real-time reasoning, tool calls,
and results. This replaces a generic loading spinner with the actual demo value
of the project — judges can see the multi-agent reasoning happening live.

The trace is rendered as a vertical timeline with agent cards that expand to
show tool calls and outputs.
"""

import streamlit as st


def render_trace() -> None:
    """Render the live agent trace timeline."""
    from utils.state import render_page_indicator
    render_page_indicator("trace")
    st.markdown(
        """
        <style>
        .trace-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.25rem;
        }
        .trace-subtitle {
            color: #64748b;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }
        .timeline {
            position: relative;
            padding-left: 2rem;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e2e8f0;
        }
        .trace-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 1rem 1.25rem;
            margin-bottom: 1rem;
            position: relative;
            transition: all 0.2s;
        }
        .trace-card::before {
            content: '';
            position: absolute;
            left: -1.65rem;
            top: 1.25rem;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #cbd5e1;
            border: 2px solid white;
        }
        .trace-card.completed {
            border-left: 3px solid #10b981;
        }
        .trace-card.completed::before {
            background: #10b981;
        }
        .trace-card.running {
            border-left: 3px solid #2563eb;
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.15);
        }
        .trace-card.running::before {
            background: #2563eb;
            animation: pulse 1.5s infinite;
        }
        .trace-card.skipped {
            border-left: 3px solid #94a3b8;
            opacity: 0.7;
        }
        .trace-card.skipped::before {
            background: #94a3b8;
        }
        .trace-card.error {
            border-left: 3px solid #ef4444;
        }
        .trace-card.error::before {
            background: #ef4444;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .trace-agent-name {
            font-weight: 700;
            font-size: 0.95rem;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .trace-status-badge {
            display: inline-block;
            padding: 0.15rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .trace-status-badge.completed {
            background: #d1fae5;
            color: #065f46;
        }
        .trace-status-badge.running {
            background: #dbeafe;
            color: #1e40af;
        }
        .trace-status-badge.skipped {
            background: #f1f5f9;
            color: #475569;
        }
        .trace-status-badge.error {
            background: #fee2e2;
            color: #991b1b;
        }
        .trace-summary {
            font-size: 0.85rem;
            color: #475569;
            margin-top: 0.35rem;
            line-height: 1.4;
        }
        .trace-duration {
            font-size: 0.75rem;
            color: #94a3b8;
            margin-top: 0.3rem;
        }
        .tool-call-badge {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 0.3rem 0.6rem;
            font-size: 0.75rem;
            display: inline-block;
            margin: 0.2rem;
            font-family: monospace;
            color: #334155;
        }
        .tool-call-detail {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.5rem 0.75rem;
            margin-top: 0.5rem;
            font-size: 0.75rem;
            font-family: monospace;
            color: #334155;
            max-height: 120px;
            overflow-y: auto;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown('<div class="trace-title">🧠 Live Agent Reasoning</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="trace-subtitle">Watch the multi-agent system triage, plan, and coordinate '
        'your emergency response in real time.</div>',
        unsafe_allow_html=True,
    )

    trace_events = st.session_state.trace_events
    if not trace_events:
        st.info("No trace events yet. The pipeline is running...")
        return

    st.markdown('<div class="timeline">', unsafe_allow_html=True)

    for i, event in enumerate(trace_events):
        agent_name = event.get("agent", "Unknown")
        status = event.get("status", "completed")
        summary = event.get("summary", "")
        duration = event.get("duration_ms", 0)
        tool_calls = event.get("tool_calls", [])

        # Staggered fade-in animation
        delay = i * 0.1

        status_label = status.capitalize()
        status_icon = {
            "completed": "✅",
            "running": "⏳",
            "skipped": "⏭️",
            "error": "❌",
        }.get(status, "⚪")

        card_class = f"trace-card {status}"

        st.markdown(
            f'<div class="{card_class}" style="animation:fadeIn {0.3 + delay}s ease-out both;">'
            f'<div class="trace-agent-name">'
            f"{status_icon} {agent_name}"
            f' <span class="trace-status-badge {status}">{status_label}</span>'
            f'</div>'
            f'<div class="trace-summary">{summary}</div>'
            f'<div class="trace-duration">⏱ {duration}ms</div>',
            unsafe_allow_html=True,
        )

        if tool_calls:
            for tc in tool_calls:
                tool_name = tc.get("name", "unknown_tool")
                args = tc.get("args", {})
                st.markdown(
                    f'<span class="tool-call-badge">🔧 {tool_name}({", ".join(args.keys())})</span>',
                    unsafe_allow_html=True,
                )
                with st.expander(f"Details: {tool_name}", expanded=False):
                    st.code(str(args), language="json")

        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)

    # Placeholder for the "Running..." indicator
    # The pipeline runner in app.py will use this placeholder to update status
    placeholder = st.empty()
    if trace_events and trace_events[-1].get("status") in ("running",):
        placeholder.info("⏳ Processing...")
    else:
        placeholder.empty()
