from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
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
                "DATABASE_URL must be set. Set DATABASE_URL via environment variables (or local dev tooling)."
            )
        return v

    @model_validator(mode="after")
    def validate_environment_database(self):
        """Ensure production/staging environments don't use localhost databases."""
        if self.environment in ("production", "staging"):
            if "localhost" in self.database_url.lower():
                raise ValueError(
                    f"Environment '{self.environment}' cannot use localhost database. "
                    "Use a proper database URL for production/staging deployments."
                )
        return self


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
