"""Firebase Admin SDK initialization and client management.

Initializes Firebase Admin exactly once using environment variables.
Never hardcodes secrets.
"""

import logging
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth as admin_auth, firestore as admin_firestore
from backend.app.core.config import settings

logger = logging.getLogger("taskflow.firebase")

_firebase_app: Optional[firebase_admin.App] = None
_firestore_db = None


def initialize_firebase_admin() -> Optional[firebase_admin.App]:
    """Initializes the Firebase Admin SDK singleton.
    
    Reads credentials exclusively from environment variables.
    Fails safely and descriptively if credentials are not configured.
    """
    global _firebase_app, _firestore_db

    if _firebase_app is not None:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        _firestore_db = admin_firestore.client()
        return _firebase_app

    if not settings.is_firebase_configured():
        logger.warning(
            "Firebase Admin credentials are not fully configured in environment variables. "
            "Server requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
        )
        return None

    try:
        cred_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "private_key": settings.FIREBASE_PRIVATE_KEY,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        _firestore_db = admin_firestore.client()
        logger.info("Firebase Admin successfully initialized for project: %s", settings.FIREBASE_PROJECT_ID)
        return _firebase_app
    except Exception as e:
        logger.error("Failed to initialize Firebase Admin SDK: %s", str(e))
        return None


def get_firestore_client():
    """Returns the initialized Cloud Firestore client."""
    global _firestore_db
    if _firestore_db is None:
        initialize_firebase_admin()
    if _firestore_db is None:
        raise RuntimeError(
            "Firestore database client is unavailable. "
            "Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
        )
    return _firestore_db


def verify_firebase_id_token(token: str) -> dict:
    """Verifies a client-provided Firebase ID token and returns decoded claims."""
    if not firebase_admin._apps:
        initialize_firebase_admin()
    if not firebase_admin._apps:
        raise RuntimeError("Firebase Admin is not initialized. Cannot verify ID token.")

    return admin_auth.verify_id_token(token)
