"""Tasks API endpoints.

All operations are scoped to the authenticated user UID verified from Firebase ID token.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from backend.app.services.firestore import firestore_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskResponse])
async def list_tasks(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieves all tasks for the authenticated user."""
    return firestore_service.list_tasks(uid=current_user.uid)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieves a single task owned by the authenticated user."""
    task = firestore_service.get_task(uid=current_user.uid, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Creates a new task owned by the authenticated user."""
    task_dict = payload.model_dump()
    return firestore_service.create_task(uid=current_user.uid, task_data=task_dict)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Partially updates a task owned by the authenticated user."""
    updates = payload.model_dump(exclude_unset=True)
    updated_task = firestore_service.update_task(
        uid=current_user.uid,
        task_id=task_id,
        updates=updates,
    )
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found or cannot be modified.",
        )
    return updated_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes a task owned by the authenticated user."""
    success = firestore_service.delete_task(uid=current_user.uid, task_id=task_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found or already deleted.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
