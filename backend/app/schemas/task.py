"""Task Pydantic schemas for request validation and response serialization."""

from typing import Annotated, List, Literal, Optional
from pydantic import BaseModel, Field


TaskPriority = Literal["low", "medium", "high"]
TaskStatus = Literal["todo", "in_progress", "completed"]
RecurrenceType = Literal["none", "daily", "weekly", "monthly"]

TagValue = Annotated[str, Field(max_length=64)]


class SubtaskSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=128, description="Unique subtask identifier")
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
    tags: List[TagValue] = Field(default_factory=list, max_length=20, description="Categorization tags")
    subtasks: List[SubtaskSchema] = Field(default_factory=list, max_length=50, description="Nested checklist items")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    id: Optional[str] = Field(default=None, max_length=128, pattern=r"^[a-zA-Z0-9_-]+$", description="Optional custom ID")


class TaskUpdate(BaseModel):
    """Schema for partial task updates."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    projectId: Optional[str] = Field(default=None, max_length=128)
    dueDate: Optional[str] = Field(default=None, max_length=64)
    dueTime: Optional[str] = Field(default=None, max_length=32)
    recurrence: Optional[RecurrenceType] = None
    tags: Optional[List[TagValue]] = Field(default=None, max_length=20)
    subtasks: Optional[List[SubtaskSchema]] = Field(default=None, max_length=50)
    completedAt: Optional[str] = Field(default=None, max_length=64)


class TaskResponse(TaskBase):
    """Complete task representation returned to clients."""
    id: str
    userId: str
    completedAt: Optional[str] = Field(default=None, max_length=64)
    createdAt: str
    updatedAt: str
