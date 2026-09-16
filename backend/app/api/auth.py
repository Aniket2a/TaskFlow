"""Authentication API endpoints."""

from fastapi import APIRouter, Depends
from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.auth import AuthenticatedUser, VerifyTokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/verify", response_model=VerifyTokenResponse)
async def verify_token(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Verifies client Firebase ID token and returns authenticated user details."""
    return VerifyTokenResponse(
        valid=True,
        uid=current_user.uid,
        email=current_user.email,
        name=current_user.name,
    )
