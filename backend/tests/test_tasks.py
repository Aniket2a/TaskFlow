"""Tests for Task CRUD operations and user isolation."""

from unittest.mock import patch


@patch("backend.app.api.tasks.firestore_service.list_tasks")
def test_list_tasks(mock_list, client, test_user):
    """Listing tasks must use the verified current_user UID."""
    mock_list.return_value = [
        {
            "id": "task_1",
            "userId": test_user.uid,
            "title": "Study Algorithms",
            "description": "Chapter 5 review",
            "status": "todo",
            "priority": "high",
            "tags": ["Study"],
            "subtasks": [],
            "createdAt": "2026-09-14T00:00:00Z",
            "updatedAt": "2026-09-14T00:00:00Z",
        }
    ]
    response = client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "task_1"
    assert data[0]["title"] == "Study Algorithms"
    mock_list.assert_called_once_with(uid=test_user.uid)


@patch("backend.app.api.tasks.firestore_service.create_task")
def test_create_task(mock_create, client, test_user):
    """Creating a task validates schemas and injects authenticated UID."""
    payload = {
        "title": "Finish Assignment 2",
        "description": "Implement B-Tree balancing in C++",
        "priority": "high",
        "status": "todo",
        "tags": ["CS301", "Urgent"],
        "subtasks": [{"id": "s1", "title": "Write unit tests", "completed": False}],
    }
    mock_create.return_value = {
        **payload,
        "id": "task_new_99",
        "userId": test_user.uid,
        "createdAt": "2026-09-14T10:00:00Z",
        "updatedAt": "2026-09-14T10:00:00Z",
    }
    response = client.post("/api/v1/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == "task_new_99"
    assert data["userId"] == test_user.uid
    assert len(data["subtasks"]) == 1


def test_create_task_validation_error(client):
    """Pydantic validation should reject missing or empty title."""
    response = client.post("/api/v1/tasks", json={"title": ""})
    assert response.status_code == 422


@patch("backend.app.api.tasks.firestore_service.update_task")
def test_update_task(mock_update, client, test_user):
    """Updating a task updates only supplied fields and preserves ownership."""
    mock_update.return_value = {
        "id": "task_1",
        "userId": test_user.uid,
        "title": "Study Algorithms (Updated)",
        "description": "Chapter 5 review",
        "status": "completed",
        "priority": "high",
        "tags": ["Study"],
        "subtasks": [],
        "createdAt": "2026-09-14T00:00:00Z",
        "updatedAt": "2026-09-14T12:00:00Z",
    }
    response = client.patch("/api/v1/tasks/task_1", json={"status": "completed", "title": "Study Algorithms (Updated)"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"


@patch("backend.app.api.tasks.firestore_service.delete_task")
def test_delete_task(mock_delete, client, test_user):
    """Deleting a task returns 204 No Content."""
    mock_delete.return_value = True
    response = client.delete("/api/v1/tasks/task_1")
    assert response.status_code == 204
    mock_delete.assert_called_once_with(uid=test_user.uid, task_id="task_1")


@patch("backend.app.api.tasks.firestore_service.delete_task")
def test_delete_task_not_found(mock_delete, client):
    """Deleting non-existent task returns 404."""
    mock_delete.return_value = False
    response = client.delete("/api/v1/tasks/non_existent")
    assert response.status_code == 404
