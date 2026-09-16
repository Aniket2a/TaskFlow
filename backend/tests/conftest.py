"""Test fixtures and mock setup for TaskFlow FastAPI backend."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.auth import AuthenticatedUser


@pytest.fixture
def test_user():
    """Mock authenticated student user."""
    return AuthenticatedUser(
        uid="test_user_student_123",
        email="student@university.edu",
        name="Student Tester",
    )


@pytest.fixture
def other_user():
    """A secondary user for testing user isolation."""
    return AuthenticatedUser(
        uid="other_user_456",
        email="other@university.edu",
        name="Other User",
    )


@pytest.fixture
def client(test_user):
    """FastAPI test client with mocked authentication dependency."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    """FastAPI test client without authentication dependency override."""
    app.dependency_overrides.clear()
    with TestClient(app) as test_client:
        yield test_client
