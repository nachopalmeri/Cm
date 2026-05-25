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

    # LLM provider settings
    LLM_PROVIDER: str = "mock"
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-20241022"


settings = Settings()
