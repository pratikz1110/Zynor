from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path
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
    
    database_url: str
    app_name: str = "Zynor API"
    environment: str = "development"

    @field_validator("database_url")
    @classmethod
    def validate_db(cls, v):
        if not v or not v.strip():
            raise ValueError(
                "DATABASE_URL must be set. Create apps/api/.env with e.g.\n"
                "DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/zynor_dev"
            )
        return v


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()


