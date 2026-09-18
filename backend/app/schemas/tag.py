"""Tag Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=128, pattern=r"^[a-zA-Z0-9_-]+$")
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = Field(default="#6366f1", max_length=32)


class TagResponse(BaseModel):
    id: str
    userId: str
    name: str
    color: str
