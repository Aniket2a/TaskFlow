"""Task Pydantic schemas for request validation and response serialization."""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


TaskPriority = Literal["low", "medium", "high"]
TaskStatus = Literal["todo", "in_progress", "completed"]
RecurrenceType = Literal["none", "daily", "weekly", "monthly"]


class SubtaskSchema(BaseModel):
    id: str = Field(..., description="Unique subtask identifier")
    title: str = Field(..., min_length=1, max_length=255, description="Subtask checklist title")
    completed: bool = Field(default=False, description="Completion status")


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(default="", max_length=2000, description="Task details")
    status: TaskStatus = Field(default="todo", description="Task lifecycle status")
    priority: TaskPriority = Field(default="medium", description="Priority tier")
    projectId: Optional[str] = Field(default=None, max_length=128, description="Associated project workspace ID")
    dueDate: Optional[str] = Field(default=None, max_length=64, description="Due date (YYYY-MM-DD)")
    dueTime: Optional[str] = Field(default=None, max_length=32, description="Due time (e.g. 16:00)")
    recurrence: Optional[RecurrenceType] = Field(default="none", description="Recurring frequency")
    tags: List[str] = Field(default_factory=list, description="Categorization tags")
    subtasks: List[SubtaskSchema] = Field(default_factory=list, description="Nested checklist items")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    id: Optional[str] = Field(default=None, max_length=128, description="Optional custom ID")


class TaskUpdate(BaseModel):
    """Schema for partial task updates."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    projectId: Optional[str] = Field(default=None, max_length=128)
    dueDate: Optional[str] = None
    dueTime: Optional[str] = None
    recurrence: Optional[RecurrenceType] = None
    tags: Optional[List[str]] = None
    subtasks: Optional[List[SubtaskSchema]] = None
    completedAt: Optional[str] = None


class TaskResponse(TaskBase):
    """Complete task representation returned to clients."""
    id: str
    userId: str
    completedAt: Optional[str] = None
    createdAt: str
    updatedAt: str
