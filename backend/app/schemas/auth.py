"""Auth & User schemas."""

from typing import Optional
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None


class VerifyTokenResponse(BaseModel):
    valid: bool
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
