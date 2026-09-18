"""Authentication dependencies for protected FastAPI routes.

Extracts and verifies Firebase ID tokens, establishing strictly verified user context.
Never trusts user IDs provided by client query params or request bodies.
"""

from typing import Optional
from fastapi import Header, HTTPException, status
from backend.app.core.firebase import verify_firebase_id_token
from backend.app.schemas.auth import AuthenticatedUser


async def get_current_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """Dependency that extracts and cryptographically verifies Firebase ID token from Authorization header.

    Raises:
        HTTPException 401: If header is missing, malformed, or token is invalid/expired.
        HTTPException 503: If Firebase Admin SDK is not configured on the server.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed Authorization header. Format must be 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()

    try:
        decoded_token = verify_firebase_id_token(token)
    except RuntimeError:
        # Server configuration issue
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is currently unconfigured or unavailable.",
        )
    except Exception:
        # Invalid / expired token. Keep provider-specific verification details server-side.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a valid user UID.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        uid=uid,
        email=decoded_token.get("email"),
        name=decoded_token.get("name") or (decoded_token.get("email", "").split("@")[0] if decoded_token.get("email") else "User"),
    )
