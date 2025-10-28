from functools import lru_cache
from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    app_name: str = "Zynor API"
    environment: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()


