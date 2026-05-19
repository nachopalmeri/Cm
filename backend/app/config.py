"""Application configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings loaded from environment."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "social-ai-os"
    DEBUG: bool = False
    DATABASE_URL: str | None = None
    API_V1_PREFIX: str = "/api/v1"
    TELEGRAM_BOT_TOKEN: str | None = None
    PEXELS_API_KEY: str | None = None
    X_API_BEARER_TOKEN: str | None = None
    ALLOWED_ORIGINS: str = "*"


settings = Settings()
