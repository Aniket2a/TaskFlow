"""Tests for authentication and token verification."""

from unittest.mock import patch
import pytest


def test_auth_verify_missing_token(unauthenticated_client):
    """Requests without Authorization header must return 401 Unauthorized."""
    response = unauthenticated_client.get("/api/v1/auth/verify")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]


def test_auth_verify_malformed_token(unauthenticated_client):
    """Requests with non-Bearer or empty tokens must return 401 Unauthorized."""
    response = unauthenticated_client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": "Basic 12345"},
    )
    assert response.status_code == 401
    assert "Malformed Authorization header" in response.json()["detail"]


@patch("backend.app.dependencies.auth.verify_firebase_id_token")
def test_auth_verify_invalid_token(mock_verify, unauthenticated_client):
    """Requests with invalid Firebase tokens must be rejected with 401."""
    mock_verify.side_effect = Exception("Token has expired")
    response = unauthenticated_client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": "Bearer expired.jwt.token"},
    )
    assert response.status_code == 401
    assert "Invalid or expired Firebase ID token" in response.json()["detail"]


@patch("backend.app.dependencies.auth.verify_firebase_id_token")
def test_auth_verify_valid_token(mock_verify, unauthenticated_client):
    """Valid Firebase ID token should successfully decode user UID."""
    mock_verify.return_value = {
        "uid": "student_verified_777",
        "email": "verified@college.edu",
        "name": "Alex Verified",
    }
    response = unauthenticated_client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": "Bearer valid.mock.token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["uid"] == "student_verified_777"
    assert data["email"] == "verified@college.edu"
