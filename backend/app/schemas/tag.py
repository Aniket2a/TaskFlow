"""Tag Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=128)
    name: str = Field(..., min_length=1, max_length=50, description="Tag label")
    color: Optional[str] = Field(default="#6366f1", max_length=32, description="Badge color")


class TagResponse(BaseModel):
    id: str
    userId: str
    name: str
    color: str
