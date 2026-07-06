"""Application configuration loaded from environment variables.

All secrets and tunable parameters are sourced from the environment
(via .env file or OS env vars) so nothing is hardcoded.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def _str(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


def _int(key: str, default: int = 0) -> int:
    try:
        return int(os.environ.get(key, str(default)))
    except (ValueError, TypeError):
        return default


# --- Gemini / ADK ---
GEMINI_API_KEY: str = _str("GEMINI_API_KEY")
GEMINI_MODEL: str = _str("GEMINI_MODEL", "gemini-2.0-flash")

# --- Security ---
RATE_LIMIT_MAX_REQUESTS: int = _int("RATE_LIMIT_MAX_REQUESTS", 20)

# --- App metadata ---
APP_NAME: str = "ResQ AI"
APP_TAGLINE: str = "Multi-Agent Disaster Response & Emergency Assistant"
APP_VERSION: str = "1.0.0"
APP_URL: str = _str("APP_URL", "http://localhost:8501")

# --- File paths ---
BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def validate() -> list[str]:
    """Return a list of missing-required-config errors (empty = ready)."""
    errors: list[str] = []
    if not GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.")
    return errors
