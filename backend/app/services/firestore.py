"""Firestore service layer for user-scoped data persistence.

Ensures strict user isolation by querying under:
  users/{uid}/tasks/{taskId}
  users/{uid}/projects/{projectId}
  users/{uid}/tags/{tagId}

Also checks compatibility with root collections if migrating.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from google.cloud.firestore_v1.base_query import FieldFilter
from backend.app.core.firebase import get_firestore_client

logger = logging.getLogger("taskflow.service.firestore")


def current_iso_time() -> str:
    """Returns ISO-8601 UTC timestamp."""
    return datetime.now(timezone.utc).isoformat()


class FirestoreService:
    """Encapsulates Firestore database operations scoped to verified Firebase UIDs."""

    def __init__(self):
        self._db = None

    @property
    def db(self):
        if self._db is None:
            self._db = get_firestore_client()
        return self._db

    # =========================================================================
    # TASK OPERATIONS (users/{uid}/tasks/{taskId})
    # =========================================================================

    def list_tasks(self, uid: str) -> List[Dict[str, Any]]:
        """Retrieves all tasks owned by the specified UID."""
        tasks: List[Dict[str, Any]] = []

        # Primary user-scoped subcollection
        user_tasks_ref = self.db.collection("users").document(uid).collection("tasks")
        for doc_snap in user_tasks_ref.stream():
            data = doc_snap.to_dict()
            data["id"] = doc_snap.id
            data["userId"] = uid
            tasks.append(data)

        # Backward-compatibility check: root /tasks collection with userId == uid
        if not tasks:
            root_tasks_ref = self.db.collection("tasks")
            query = root_tasks_ref.where(filter=FieldFilter("userId", "==", uid))
            for doc_snap in query.stream():
                data = doc_snap.to_dict()
                data["id"] = doc_snap.id
                data["userId"] = uid
                tasks.append(data)

        return tasks

    def get_task(self, uid: str, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single task owned by the specified UID."""
        # Check user-scoped subcollection
        doc_ref = self.db.collection("users").document(uid).collection("tasks").document(task_id)
        doc_snap = doc_ref.get()
        if doc_snap.exists:
            data = doc_snap.to_dict()
            data["id"] = doc_snap.id
            data["userId"] = uid
            return data

        # Check root collection for backwards compatibility
        root_doc_ref = self.db.collection("tasks").document(task_id)
        root_snap = root_doc_ref.get()
        if root_snap.exists:
            data = root_snap.to_dict()
            if data.get("userId") == uid:
                data["id"] = root_snap.id
                return data

        return None

    def create_task(self, uid: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new task scoped strictly to the authenticated UID."""
        task_id = task_data.get("id") or f"task_{uuid.uuid4().hex[:12]}"
        now = current_iso_time()

        payload = {
            **task_data,
            "id": task_id,
            "userId": uid,
            "createdAt": task_data.get("createdAt") or now,
            "updatedAt": now,
        }

        # Write to user-scoped collection
        doc_ref = self.db.collection("users").document(uid).collection("tasks").document(task_id)
        doc_ref.set(payload)

        return payload

    def update_task(self, uid: str, task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates an existing task owned by the specified UID."""
        doc_ref = self.db.collection("users").document(uid).collection("tasks").document(task_id)
        doc_snap = doc_ref.get()

        if not doc_snap.exists:
            # Check legacy root doc
            root_ref = self.db.collection("tasks").document(task_id)
            root_snap = root_ref.get()
            if not root_snap.exists or root_snap.to_dict().get("userId") != uid:
                return None
            doc_ref = root_ref

        now = current_iso_time()
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        clean_updates["updatedAt"] = now

        doc_ref.update(clean_updates)
        updated_doc = doc_ref.get()
        data = updated_doc.to_dict()
        data["id"] = task_id
        data["userId"] = uid
        return data

    def delete_task(self, uid: str, task_id: str) -> bool:
        """Deletes a task owned by the specified UID."""
        doc_ref = self.db.collection("users").document(uid).collection("tasks").document(task_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return True

        # Check legacy root
        root_ref = self.db.collection("tasks").document(task_id)
        root_snap = root_ref.get()
        if root_snap.exists and root_snap.to_dict().get("userId") == uid:
            root_ref.delete()
            return True

        return False

    # =========================================================================
    # PROJECT OPERATIONS (users/{uid}/projects/{projectId})
    # =========================================================================

    def list_projects(self, uid: str) -> List[Dict[str, Any]]:
        """Retrieves all project workspaces owned by the specified UID."""
        projects: List[Dict[str, Any]] = []

        user_projects_ref = self.db.collection("users").document(uid).collection("projects")
        for doc_snap in user_projects_ref.stream():
            data = doc_snap.to_dict()
            data["id"] = doc_snap.id
            data["userId"] = uid
            projects.append(data)

        # Fallback to root projects collection if needed
        if not projects:
            root_projects_ref = self.db.collection("projects")
            query = root_projects_ref.where(filter=FieldFilter("userId", "==", uid))
            for doc_snap in query.stream():
                data = doc_snap.to_dict()
                data["id"] = doc_snap.id
                data["userId"] = uid
                projects.append(data)

        return projects

    def create_project(self, uid: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new workspace project."""
        project_id = project_data.get("id") or f"proj_{uuid.uuid4().hex[:10]}"
        now = current_iso_time()

        payload = {
            **project_data,
            "id": project_id,
            "userId": uid,
            "createdAt": project_data.get("createdAt") or now,
            "updatedAt": now,
        }

        doc_ref = self.db.collection("users").document(uid).collection("projects").document(project_id)
        doc_ref.set(payload)
        return payload

    def update_project(self, uid: str, project_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates a workspace project."""
        doc_ref = self.db.collection("users").document(uid).collection("projects").document(project_id)
        doc_snap = doc_ref.get()
        if not doc_snap.exists:
            return None

        clean_updates = {k: v for k, v in updates.items() if v is not None}
        clean_updates["updatedAt"] = current_iso_time()
        doc_ref.update(clean_updates)

        updated = doc_ref.get().to_dict()
        updated["id"] = project_id
        updated["userId"] = uid
        return updated

    def delete_project(self, uid: str, project_id: str) -> bool:
        """Deletes a workspace project and unlinks associated tasks (projectId = null)."""
        doc_ref = self.db.collection("users").document(uid).collection("projects").document(project_id)
        if not doc_ref.get().exists:
            return False

        doc_ref.delete()

        # Unlink tasks associated with this project (projectId -> None)
        try:
            tasks_ref = self.db.collection("users").document(uid).collection("tasks")
            tasks_query = tasks_ref.where(filter=FieldFilter("projectId", "==", project_id))
            for task_doc in tasks_query.stream():
                task_doc.reference.update({"projectId": None, "updatedAt": current_iso_time()})
        except Exception as e:
            logger.warning("Warning unlinking tasks during project deletion: %s", str(e))

        return True

    # =========================================================================
    # TAG OPERATIONS (users/{uid}/tags/{tagId})
    # =========================================================================

    def list_tags(self, uid: str) -> List[Dict[str, Any]]:
        """Retrieves all tags owned by user."""
        tags: List[Dict[str, Any]] = []
        tags_ref = self.db.collection("users").document(uid).collection("tags")
        for doc_snap in tags_ref.stream():
            data = doc_snap.to_dict()
            data["id"] = doc_snap.id
            data["userId"] = uid
            tags.append(data)
        return tags

    def create_tag(self, uid: str, tag_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new user tag."""
        tag_id = tag_data.get("id") or f"tag_{uuid.uuid4().hex[:8]}"
        payload = {
            **tag_data,
            "id": tag_id,
            "userId": uid,
        }
        doc_ref = self.db.collection("users").document(uid).collection("tags").document(tag_id)
        doc_ref.set(payload)
        return payload

    def delete_tag(self, uid: str, tag_id: str) -> bool:
        """Deletes a user tag."""
        doc_ref = self.db.collection("users").document(uid).collection("tags").document(tag_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True


# Singleton service instance
firestore_service = FirestoreService()
