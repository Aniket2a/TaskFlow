"""Tags API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.tag import TagCreate, TagResponse
from backend.app.services.firestore import firestore_service

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("", response_model=List[TagResponse])
async def list_tags(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieves all tags for the authenticated user."""
    return firestore_service.list_tags(uid=current_user.uid)


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Creates a new user tag."""
    return firestore_service.create_tag(uid=current_user.uid, tag_data=payload.model_dump())


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes a tag owned by the authenticated user."""
    success = firestore_service.delete_tag(uid=current_user.uid, tag_id=tag_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag '{tag_id}' not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
