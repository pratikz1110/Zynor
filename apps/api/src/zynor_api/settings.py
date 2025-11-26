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

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or not DATABASE_URL.strip():
    raise RuntimeError(
        "DATABASE_URL is not set. Create apps/api/.env with e.g.\n"
        "DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/zynor_dev"
    )


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )
    
    app_name: str = "Zynor API"
    environment: str = "development"


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()


