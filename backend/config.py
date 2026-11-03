from decimal import Decimal
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Bae Habibi Wrap API"
    debug: bool = False
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/bae_habibi_wrap"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    delivery_fee: Decimal = Decimal("2.50")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

