from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.tasks import router as tasks_router
from backend.app.api.projects import router as projects_router
from backend.app.api.tags import router as tags_router
from backend.app.api.meta import router as meta_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(tasks_router)
api_router.include_router(projects_router)
api_router.include_router(tags_router)
api_router.include_router(meta_router)

__all__ = ["api_router"]
