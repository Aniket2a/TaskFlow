"""System metadata and API information."""

from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.schemas.meta import MetaResponse

router = APIRouter(tags=["Metadata"])


@router.get("/meta", response_model=MetaResponse)
async def get_metadata():
    """Returns application metadata and server environment status."""
    return MetaResponse(
        app="TaskFlow",
        tagline="Plan smarter. Focus better. Get things done.",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        firebase_configured=settings.is_firebase_configured(),
        supported_auth="firebase_id_token",
    )
