"""Configuration management for TaskFlow backend.

Loads environment variables for FastAPI and Firebase Admin SDK.
Never hardcodes secrets or credentials.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()


class Settings:
    """Application settings resolved exclusively from environment variables."""

    # Server Configuration
    PROJECT_NAME: str = "TaskFlow API"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Security & CORS (never use wildcard in production)
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    # Firebase Admin SDK Configuration
    # These MUST be supplied via environment variables
    FIREBASE_PROJECT_ID: Optional[str] = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_CLIENT_EMAIL: Optional[str] = os.getenv("FIREBASE_CLIENT_EMAIL")

    @property
    def FIREBASE_PRIVATE_KEY(self) -> Optional[str]:
        """Resolves the private key and correctly formats escaped newline characters."""
        raw_key = os.getenv("FIREBASE_PRIVATE_KEY")
        if not raw_key:
            return None
        # Support escaped newlines from environment variables
        return raw_key.replace("\\n", "\n").strip()

    def is_firebase_configured(self) -> bool:
        """Checks if all required Firebase Admin credentials are provided in env."""
        return bool(
            self.FIREBASE_PROJECT_ID
            and self.FIREBASE_CLIENT_EMAIL
            and self.FIREBASE_PRIVATE_KEY
        )


settings = Settings()
