"""Tests for Tag CRUD operations."""

from unittest.mock import patch


@patch("backend.app.api.tags.firestore_service.list_tags")
def test_list_tags(mock_list, client, test_user):
    """Listing tags returns tags scoped to authenticated user."""
    mock_list.return_value = [
        {"id": "tag_1", "userId": test_user.uid, "name": "Urgent", "color": "#ef4444"}
    ]
    response = client.get("/api/v1/tags")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Urgent"


@patch("backend.app.api.tags.firestore_service.create_tag")
def test_create_tag(mock_create, client, test_user):
    """Creating tag returns 201 Created."""
    mock_create.return_value = {
        "id": "tag_2",
        "userId": test_user.uid,
        "name": "Midterm",
        "color": "#3b82f6",
    }
    response = client.post("/api/v1/tags", json={"name": "Midterm", "color": "#3b82f6"})
    assert response.status_code == 201
    assert response.json()["name"] == "Midterm"


@patch("backend.app.api.tags.firestore_service.delete_tag")
def test_delete_tag(mock_delete, client, test_user):
    """Deleting a tag returns 204."""
    mock_delete.return_value = True
    response = client.delete("/api/v1/tags/tag_1")
    assert response.status_code == 204
    mock_delete.assert_called_once_with(uid=test_user.uid, tag_id="tag_1")
