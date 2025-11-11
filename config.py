"""
Configuration settings for the FHIR Chat Application
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-3.5-turbo"

    # FHIR Server Configuration
    fhir_server_url: str = "https://hapi.fhir.org/baseR4"

    # RAG Configuration
    use_rag: bool = False  # Set to True to enable RAG

    # API Configuration
    api_title: str = "FHIR Chat API"
    api_version: str = "1.0.0"
    api_description: str = "API for patient data retrieval and chat-based symptom extraction"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
