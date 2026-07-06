"""Application configuration loaded from environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def _str(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


# --- Gemini / ADK ---
GEMINI_API_KEY: str = _str("GEMINI_API_KEY")
GEMINI_MODEL: str = _str("GEMINI_MODEL", "gemini-2.0-flash")

# --- File paths ---
BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
