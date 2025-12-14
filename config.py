"""
Configuration settings for the FHIR Chat Application
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-3.5-turbo"

    # FHIR Server Configuration
    # Supports both Docker (http://hapi-fhir:8080/fhir) and Railway deployments
    fhir_server_url: str = "http://hapi-fhir:8080/fhir"

    # Tribal Knowledge Database Configuration
    # Railway provides DATABASE_URL, but we support individual components too
    tribal_db_host: str = "postgres-tribal"
    tribal_db_port: int = 5432
    tribal_db_name: str = "tribal_knowledge"
    tribal_db_user: str = "tribaluser"
    tribal_db_password: str = "tribalpassword"

    # Railway-specific: Full database URL (optional, overrides individual components)
    database_url: Optional[str] = None

    # RAG Configuration
    use_rag: bool = True  # Enabled for tribal knowledge + medical guidelines

    # API Configuration
    api_title: str = "MediChat FHIR Triage & Scheduling API"
    api_version: str = "2.0.0"
    api_description: str = "AI-powered medical triage with intelligent appointment scheduling"

    # Server Configuration (Railway sets PORT automatically)
    port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def tribal_db_url(self) -> str:
        """Construct PostgreSQL connection URL for tribal knowledge database"""
        # If Railway provides full DATABASE_URL, use it
        if self.database_url:
            return self.database_url
        # Otherwise, construct from components
        return f"postgresql://{self.tribal_db_user}:{self.tribal_db_password}@{self.tribal_db_host}:{self.tribal_db_port}/{self.tribal_db_name}"

    @property
    def async_tribal_db_url(self) -> str:
        """Construct async PostgreSQL connection URL for tribal knowledge database"""
        # If Railway provides full DATABASE_URL, convert to async
        if self.database_url:
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        # Otherwise, construct from components
        return f"postgresql+asyncpg://{self.tribal_db_user}:{self.tribal_db_password}@{self.tribal_db_host}:{self.tribal_db_port}/{self.tribal_db_name}"


settings = Settings()
