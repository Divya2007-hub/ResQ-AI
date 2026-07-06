"""Input sanitisation tool — MCP-exposed.

Why MCP and not hardcoded:
  Prompt-injection defence must be applied *before* any user input reaches
  the agent system. Hardcoding a sanitisation function into an agent prompt
  would be ineffective (the agent may be tricked into skipping it). Exposing
  it as an MCP tool that the application layer calls BEFORE invoking any agent
  provides a true security boundary. It also makes the sanitisation logic
  independently testable and auditable.
"""

import re
from mcp.tool_schemas import SanitizeInput, SanitizeOutput

# Attack patterns — grouped by category for clear reasoning output.
_INJECTION_PATTERNS: list[tuple[str, str, str]] = [
    # Direct prompt injection
    ("ignore_previous", r"\signore\s+(all\s+)?(previous|above|prior)\s+(instructions|commands|prompts)\s*i",
     "Prompt-injection attempt: 'ignore previous instructions' pattern detected."),
    ("system_override", r"\syou\s+are\s+(now|not\s+required\s+to)\s+|pretend\s+(that\s+)?you.are|act\s+as\s+if\s+",
     "Prompt-injection attempt: system-role override pattern detected."),
    ("gate_break", r"\sdo\s+not\s+(follow|adhere|obey)\s+|disregard\s+|bypass\s+",
     "Prompt-injection attempt: gate-breaking directive detected."),
    ("token_leak", r"\s(output|print|show|display|reveal)\s+(your\s+)?(system\s+)?prompt|tell\s+me\s+(your|the)\s+prompt\s+",
     "Prompt-injection attempt: prompt-leak request detected."),
    ("delimiter_confusion", r"-{5,}|_{5,}|[\w\s]+\n.*```|\b```\s*\w*\s*\n",
     "Prompt-injection attempt: delimiter confusion pattern detected."),
    # Harmful content
    ("harmful_command", r"\b(hack|crack|exploit|malware|ransomware|ddos|sql\s+inject)\b.*",
     "Harmful-content block: security-exploit keyword detected."),
]


def sanitize_input(raw_text: str) -> dict:
    """Scan raw user input for prompt-injection patterns and harmful content.

    Returns:
      - clean_text: the original text (or redacted version if severe)
      - flagged: whether anything suspicious was found
      - reason: human-readable explanation for the UI
    """
    inp = SanitizeInput(raw_text=raw_text)
    lowered = inp.raw_text.lower()

    flagged_patterns: list[str] = []

    for pattern_id, regex, reason in _INJECTION_PATTERNS:
        if re.search(regex, lowered, re.IGNORECASE | re.MULTILINE):
            flagged_patterns.append(pattern_id)

    flagged = len(flagged_patterns) > 0
    reason: str

    if not flagged:
        reason = "No injection patterns detected. Input is clean."
        clean = inp.raw_text
    else:
        readable = ", ".join(flagged_patterns)
        # Find the first matching reason text
        match_reasons = [r for pid, _, r in _INJECTION_PATTERNS if pid in flagged_patterns]
        reason = "; ".join(match_reasons)
        # For UI demo, we return the original text alongside the flag so the
        # user can see what was caught. In production you'd redact or block.
        clean = inp.raw_text

    out = SanitizeOutput(clean_text=clean, flagged=flagged, reason=reason)
    return out.model_dump()
