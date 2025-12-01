from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import os
from dotenv import load_dotenv

# Load candidate .env files in priority order
_CANDIDATES = [
    Path(__file__).resolve().parents[2] / ".env",   # apps/api/.env
    Path(__file__).resolve().parents[3] / ".env",   # repo-root/.env (optional)
]

for p in _CANDIDATES:
    try:
        if p.exists():
            load_dotenv(p, override=False)
    except Exception:
        # don't crash on load errors; we'll validate below
        pass


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )
    
    app_name: str = "Zynor API"
    environment: str = "development"
    DATABASE_URL: str = "sqlite+aiosqlite:///./zynor_ci.db"


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()


