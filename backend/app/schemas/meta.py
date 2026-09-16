"""System metadata schemas."""

from typing import Optional
from pydantic import BaseModel


class MetaResponse(BaseModel):
    app: str
    tagline: str
    version: str
    environment: str
    firebase_configured: bool
    supported_auth: str
