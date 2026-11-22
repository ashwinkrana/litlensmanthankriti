"""Application settings, loaded from `.env` at the repo root (SECURITY S-1).

API keys are `SecretStr` so they never show up in logs or reprs (SECURITY S-3).
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/config.py -> parents[2] is the repo root
REPO_ROOT = Path(__file__).resolve().parents[2]

_PLACEHOLDER_PREFIXES = ("your-", "changeme")
_LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- LLM keys (backend only) ---
    groq_api_key: SecretStr | None = None
    gemini_api_key: SecretStr | None = None
    gemini_model: str = ""  # no default on purpose (DESIGN §5)

    # --- Models ---
    groq_fast_model: str = "openai/gpt-oss-20b"
    groq_smart_model: str = "openai/gpt-oss-120b"

    # --- Groq free-tier limits per model ---
    groq_tpm: int = 8000
    groq_rpm: int = 30

    # --- LLM call options ---
    groq_reasoning_effort: Literal["low", "medium", "high"] = "low"
    # Optional; allowed values differ per Gemini model (e.g. low/medium/high).
    gemini_thinking_level: str = ""
    llm_timeout_s: float = 60.0
    # M6 test switch: every Groq call acts like a 429 so the Gemini fallback runs.
    # Only honoured when ENV=dev.
    debug_force_groq_429: bool = False

    # --- Server ---
    env: Literal["dev", "prod"] = "dev"
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Storage ---
    data_dir: Path = Path("data")

    # --- Behaviour ---
    demo_mode: bool = False
    support_threshold: float = 0.35
    log_level: str = "INFO"

    # --- arXiv politeness ---
    arxiv_contact: str = ""

    @field_validator("groq_api_key", "gemini_api_key", mode="before")
    @classmethod
    def _blank_or_placeholder_is_none(cls, v: object) -> object:
        """Treat empty values and the `.env.example` placeholders as 'not set'."""
        if v is None:
            return None
        raw = v.get_secret_value() if isinstance(v, SecretStr) else str(v)
        raw = raw.strip()
        if not raw or raw.lower().startswith(_PLACEHOLDER_PREFIXES):
            return None
        return raw

    @field_validator("data_dir", mode="after")
    @classmethod
    def _resolve_data_dir(cls, v: Path) -> Path:
        """Relative DATA_DIR is resolved from the repo root, not the current folder."""
        return v if v.is_absolute() else (REPO_ROOT / v).resolve()

    # --- Derived values ---
    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        # SECURITY N-2: never allow every origin.
        return [o for o in origins if o != "*"]

    @property
    def groq_configured(self) -> bool:
        return self.groq_api_key is not None

    @property
    def gemini_configured(self) -> bool:
        """Fallback needs both a key and an explicit model ID."""
        return self.gemini_api_key is not None and bool(self.gemini_model.strip())

    @property
    def is_dev(self) -> bool:
        return self.env == "dev"

    @property
    def host_is_loopback(self) -> bool:
        return self.host in _LOOPBACK_HOSTS


@lru_cache
def get_settings() -> Settings:
    return Settings()
