"""Project Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, description="Project workspace name")
    description: Optional[str] = Field(default="", max_length=1000, description="Project objectives")
    color: str = Field(default="#6366f1", max_length=32, description="Theme color code")
    icon: Optional[str] = Field(default=None, max_length=64, description="Optional icon identifier")


class ProjectCreate(ProjectBase):
    id: Optional[str] = Field(default=None, max_length=128)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    description: Optional[str] = Field(default=None, max_length=1000)
    color: Optional[str] = Field(default=None, max_length=32)
    icon: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: str
    userId: str
    createdAt: str
    updatedAt: str
