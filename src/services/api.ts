/**
 * Centralized API & Persistence Client for TaskFlow.
 *
 * For the AI Studio preview runtime, TaskFlow application data persistence
 * directly uses the Firebase Client SDK scoped to the authenticated user:
 *   users/{uid}/tasks/{taskId}
 *   users/{uid}/projects/{projectId}
 *   users/{uid}/tags/{tagId}
 *
 * This completely eliminates 404 network failures and root-collection permission errors.
 * The separate Python FastAPI backend in /backend is preserved for external deployment.
 */

import {
  auth,
  getUserTasks,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  getUserProjects,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  getUserTags,
  saveTagToFirestore,
  deleteTagFromFirestore,
  getIdToken,
} from '../lib/firebase';
import { Project, Tag, Task } from '../types';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

/**
 * Base fetch wrapper with Bearer token injection and timeout.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch {
        // Response was not JSON
      }
      throw new ApiError(errorDetail, response.status, errorData);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network connection failed', 0);
  }
}

export const api = {
  auth: {
    verify: async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new ApiError('No authenticated user found', 401);
      }
      return {
        valid: true,
        uid: currentUser.uid,
        email: currentUser.email || undefined,
        name: currentUser.displayName || undefined,
      };
    },
    getIdToken: () => getIdToken(),
  },

  health: {
    check: async () => ({ status: 'ok', service: 'taskflow-firestore', version: '2.0.0' }),
    meta: async () => ({
      app: 'TaskFlow',
      tagline: 'Modern Task Management Powered by Firebase',
      version: '2.0.0',
    }),
  },

  tasks: {
    list: async (userId?: string): Promise<Task[]> => {
      const tasks = await getUserTasks(userId);
      return tasks || [];
    },

    get: async (id: string, userId?: string): Promise<Task> => {
      const tasks = await getUserTasks(userId);
      const task = tasks.find((t) => t.id === id);
      if (!task) {
        throw new ApiError(`Task with id ${id} not found`, 404);
      }
      return task;
    },

    create: async (
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & {
        id?: string;
        userId?: string;
      },
      userId?: string
    ): Promise<Task> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || taskData.userId || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to create a task', 401);
      }

      const taskId = taskData.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();

      const cleanSubtasks = Array.isArray(taskData.subtasks)
        ? taskData.subtasks.map((st) => ({
            id: st.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: st.title ? String(st.title).trim() : '',
            completed: Boolean(st.completed),
          }))
        : [];

      const cleanTags = Array.isArray(taskData.tags)
        ? taskData.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        : [];

      const newTask: Task = {
        id: taskId,
        userId: uid,
        title: taskData.title ? taskData.title.trim() : 'Untitled',
        description: taskData.description ? taskData.description.trim() : '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        projectId: taskData.projectId ? taskData.projectId.trim() : '',
        tags: cleanTags,
        subtasks: cleanSubtasks,
        recurrence: taskData.recurrence || 'none',
        createdAt: now,
        updatedAt: now,
      };

      if (taskData.dueDate && typeof taskData.dueDate === 'string' && taskData.dueDate.trim() !== '') {
        newTask.dueDate = taskData.dueDate.trim();
      }

      if (taskData.dueTime && typeof taskData.dueTime === 'string' && taskData.dueTime.trim() !== '') {
        newTask.dueTime = taskData.dueTime.trim();
      }

      if (taskData.status === 'completed') {
        newTask.completedAt =
          taskData.completedAt && typeof taskData.completedAt === 'string' && taskData.completedAt.trim() !== ''
            ? taskData.completedAt.trim()
            : now;
      }

      await saveTaskToFirestore(newTask, uid);
      return newTask;
    },

    update: async (id: string, updates: Partial<Task>, userId?: string): Promise<Task> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to update a task', 401);
      }

      const tasks = await getUserTasks(uid);
      const existing = tasks.find((t) => t.id === id);

      const resolvedTitle =
        updates.title !== undefined
          ? (updates.title ? updates.title.trim() : 'Untitled')
          : (existing?.title ?? 'Untitled Task');

      const resolvedDescription =
        updates.description !== undefined
          ? (updates.description ? updates.description.trim() : '')
          : (existing?.description ?? '');

      const resolvedStatus = updates.status ?? existing?.status ?? 'todo';
      const resolvedPriority = updates.priority ?? existing?.priority ?? 'medium';

      const resolvedProjectId =
        updates.projectId !== undefined
          ? (updates.projectId ? updates.projectId.trim() : '')
          : (existing?.projectId ?? '');

      const resolvedTags =
        updates.tags !== undefined
          ? (Array.isArray(updates.tags) ? updates.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0) : [])
          : (existing?.tags ?? []);

      const resolvedSubtasks =
        updates.subtasks !== undefined
          ? (Array.isArray(updates.subtasks)
              ? updates.subtasks.map((st) => ({
                  id: st.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  title: st.title ? String(st.title).trim() : '',
                  completed: Boolean(st.completed),
                }))
              : [])
          : (existing?.subtasks ?? []);

      const resolvedRecurrence = updates.recurrence ?? existing?.recurrence ?? 'none';

      const updatedTask: Task = {
        id,
        userId: uid,
        title: resolvedTitle,
        description: resolvedDescription,
        status: resolvedStatus,
        priority: resolvedPriority,
        projectId: resolvedProjectId,
        tags: resolvedTags,
        subtasks: resolvedSubtasks,
        recurrence: resolvedRecurrence,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Handle dueDate
      const rawDueDate = updates.dueDate !== undefined ? updates.dueDate : existing?.dueDate;
      if (rawDueDate && typeof rawDueDate === 'string' && rawDueDate.trim() !== '') {
        updatedTask.dueDate = rawDueDate.trim();
      }

      // Handle dueTime
      const rawDueTime = updates.dueTime !== undefined ? updates.dueTime : existing?.dueTime;
      if (rawDueTime && typeof rawDueTime === 'string' && rawDueTime.trim() !== '') {
        updatedTask.dueTime = rawDueTime.trim();
      }

      // Handle completedAt
      if (updatedTask.status === 'completed') {
        const rawCompletedAt = updates.completedAt !== undefined ? updates.completedAt : existing?.completedAt;
        updatedTask.completedAt =
          rawCompletedAt && typeof rawCompletedAt === 'string' && rawCompletedAt.trim() !== ''
            ? rawCompletedAt.trim()
            : new Date().toISOString();
      }

      await saveTaskToFirestore(updatedTask, uid);
      return updatedTask;
    },

    delete: async (id: string, userId?: string): Promise<void> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to delete a task', 401);
      }

      await deleteTaskFromFirestore(id, uid);
    },
  },

  projects: {
    list: async (userId?: string): Promise<Project[]> => {
      const projects = await getUserProjects(userId);
      return projects || [];
    },

    create: async (
      project: Omit<Project, 'id'> & { id?: string },
      userId?: string
    ): Promise<Project> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to create a project', 401);
      }

      const projectId = project.id || `proj_${Date.now()}`;
      const newProj: Project = { ...project, id: projectId };
      await saveProjectToFirestore(newProj, uid);
      return newProj;
    },

    update: async (id: string, updates: Partial<Project>, userId?: string): Promise<Project> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to update a project', 401);
      }

      const projects = await getUserProjects(uid);
      const existing = projects.find((p) => p.id === id);

      const updatedProject: Project = {
        id,
        name: updates.name ?? existing?.name ?? 'Untitled Project',
        color: updates.color ?? existing?.color ?? '#6366f1',
        icon: updates.icon ?? existing?.icon,
        description: updates.description ?? existing?.description,
      };

      await saveProjectToFirestore(updatedProject, uid);
      return updatedProject;
    },

    delete: async (id: string, userId?: string): Promise<void> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to delete a project', 401);
      }

      await deleteProjectFromFirestore(id, uid);
    },
  },

  tags: {
    list: async (userId?: string): Promise<Tag[]> => {
      const tags = await getUserTags(userId);
      return tags || [];
    },

    create: async (tag: Omit<Tag, 'id'> & { id?: string }, userId?: string): Promise<Tag> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to create a tag', 401);
      }

      const tagId = tag.id || `tag_${Date.now()}`;
      const newTag: Tag = { ...tag, id: tagId };
      await saveTagToFirestore(newTag, uid);
      return newTag;
    },

    delete: async (id: string, userId?: string): Promise<void> => {
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || userId;
      if (!uid) {
        throw new ApiError('User must be authenticated to delete a tag', 401);
      }

      await deleteTagFromFirestore(id, uid);
    },
  },
};
