"""TaskFlow FastAPI Application Entrypoint.

Plan smarter. Focus better. Get things done.
A student-built, production-ready productivity and task management REST API.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.api import api_router
from backend.app.core.config import settings
from backend.app.core.firebase import initialize_firebase_admin

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("taskflow.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("Starting TaskFlow API (v%s)...", settings.VERSION)
    # Attempt to initialize Firebase Admin singleton at startup
    initialize_firebase_admin()
    yield
    logger.info("TaskFlow API shutdown.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Modern productivity REST API for students and developers. Integrates with Firebase Admin & Firestore.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
# Restricts origins strictly to configured frontend instead of wildcards
allowed_origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]
# Remove duplicates while preserving order
origins_list = list(dict.fromkeys(filter(bool, allowed_origins)))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Global Safe Exception Handler (never exposes internal stack traces or secrets to users)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled server exception on %s %s: %s", request.method, request.url.path, str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please check server logs for details."},
    )


# Health check endpoint for container monitors and uptime checkers
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container monitors."""
    return {
        "status": "healthy",
        "service": "taskflow-api",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "firebase_configured": settings.is_firebase_configured(),
    }


# Mount all modular v1 API routes
app.include_router(api_router)
