from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


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


