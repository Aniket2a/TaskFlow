"""Projects API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from backend.app.services.firestore import firestore_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieves all project workspaces for the authenticated user."""
    return firestore_service.list_projects(uid=current_user.uid)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Creates a new project workspace for the authenticated user."""
    return firestore_service.create_project(uid=current_user.uid, project_data=payload.model_dump())


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Updates an existing project workspace."""
    updates = payload.model_dump(exclude_unset=True)
    updated = firestore_service.update_project(
        uid=current_user.uid,
        project_id=project_id,
        updates=updates,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found.",
        )
    return updated


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes a project workspace and safely detaches associated tasks (projectId = null)."""
    success = firestore_service.delete_project(uid=current_user.uid, project_id=project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found or already deleted.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
