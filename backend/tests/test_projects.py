"""Tests for Project CRUD operations."""

from unittest.mock import patch


@patch("backend.app.api.projects.firestore_service.list_projects")
def test_list_projects(mock_list, client, test_user):
    """Listing projects returns projects scoped to authenticated user."""
    mock_list.return_value = [
        {
            "id": "proj_1",
            "userId": test_user.uid,
            "name": "Distributed Systems",
            "color": "#6366f1",
            "description": "CS Course",
            "createdAt": "2026-09-14T00:00:00Z",
            "updatedAt": "2026-09-14T00:00:00Z",
        }
    ]
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Distributed Systems"
    mock_list.assert_called_once_with(uid=test_user.uid)


@patch("backend.app.api.projects.firestore_service.create_project")
def test_create_project(mock_create, client, test_user):
    """Creating a project requires name and color."""
    payload = {
        "name": "Machine Learning",
        "description": "Neural networks lab",
        "color": "#10b981",
    }
    mock_create.return_value = {
        **payload,
        "id": "proj_new",
        "userId": test_user.uid,
        "createdAt": "2026-09-14T00:00:00Z",
        "updatedAt": "2026-09-14T00:00:00Z",
    }
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Machine Learning"


@patch("backend.app.api.projects.firestore_service.delete_project")
def test_delete_project(mock_delete, client, test_user):
    """Deleting a project invokes unlinking and returns 204."""
    mock_delete.return_value = True
    response = client.delete("/api/v1/projects/proj_1")
    assert response.status_code == 204
    mock_delete.assert_called_once_with(uid=test_user.uid, project_id="proj_1")
