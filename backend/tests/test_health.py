"""Tests for health and metadata endpoints."""


def test_health_endpoint(unauthenticated_client):
    """Health check endpoint should return 200 OK without requiring authentication."""
    response = unauthenticated_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "taskflow-api"
    assert "version" in data


def test_meta_endpoint(unauthenticated_client):
    """Metadata endpoint should return system specs."""
    response = unauthenticated_client.get("/api/v1/meta")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "TaskFlow"
    assert data["tagline"] == "Plan smarter. Focus better. Get things done."
    assert data["supported_auth"] == "firebase_id_token"
