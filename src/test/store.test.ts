import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskFlowStore } from '../store/useTaskFlowStore';
import { api } from '../services/api';

// Mock the API client
vi.mock('../services/api', () => ({
  api: {
    tasks: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async (task) => ({
        ...task,
        id: task.id || `server_task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: 'test_user_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      update: vi.fn().mockImplementation(async (id, updates) => ({
        id,
        ...updates,
      })),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    projects: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async (proj) => ({
        ...proj,
        id: proj.id || `server_proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      })),
      update: vi.fn().mockImplementation(async (id, updates) => ({
        id,
        ...updates,
      })),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    tags: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async (tag) => ({
        ...tag,
        id: tag.id || `server_tag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      })),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
  ApiError: class extends Error {},
}));

describe('TaskFlow Zustand Store & Business Logic', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTaskFlowStore.setState({
      tasks: [],
      projects: [],
      tags: [],
      user: {
        id: 'test_user_1',
        name: 'Test Student',
        email: 'student@example.edu',
        role: 'Student',
      },
      activeTab: 'overview',
      selectedProjectId: null,
      searchQuery: '',
      selectedPriorityFilter: 'all',
      selectedTagFilter: 'all',
      selectedStatusFilter: 'all',
      isLoading: false,
      apiError: null,
    });
  });

  it('initializes with empty task list (no mock data pollution)', () => {
    const tasks = useTaskFlowStore.getState().tasks;
    expect(tasks).toEqual([]);
    expect(tasks.length).toBe(0);
  });

  it('creates task, calls api.tasks.create and updates local store state', async () => {
    const store = useTaskFlowStore.getState();
    const newTask = await store.createTask({
      title: 'Prepare Lab Presentation',
      priority: 'high',
      status: 'todo',
      projectId: 'proj_1',
      tags: ['CS101'],
      subtasks: [],
    });

    expect(newTask.title).toBe('Prepare Lab Presentation');
    expect(api.tasks.create).toHaveBeenCalled();

    const currentTasks = useTaskFlowStore.getState().tasks;
    expect(currentTasks.length).toBe(1);
    expect(currentTasks[0].title).toBe('Prepare Lab Presentation');
  });

  it('completes task and updates its status', async () => {
    const store = useTaskFlowStore.getState();
    const task = await store.createTask({
      title: 'Complete Homework 4',
      priority: 'medium',
      status: 'todo',
      projectId: '',
      tags: [],
      subtasks: [],
    });

    expect(useTaskFlowStore.getState().tasks[0].status).toBe('todo');

    await store.toggleTaskStatus(task.id);
    expect(useTaskFlowStore.getState().tasks[0].status).toBe('completed');
    expect(useTaskFlowStore.getState().tasks[0].completedAt).toBeDefined();

    await store.toggleTaskStatus(task.id);
    expect(useTaskFlowStore.getState().tasks[0].status).toBe('todo');
  });

  it('deletes task from store and calls API', async () => {
    const store = useTaskFlowStore.getState();
    const task = await store.createTask({
      title: 'Task to be deleted',
      priority: 'low',
      status: 'todo',
      projectId: '',
      tags: [],
      subtasks: [],
    });

    expect(useTaskFlowStore.getState().tasks.length).toBe(1);

    await store.deleteTask(task.id);
    expect(useTaskFlowStore.getState().tasks.length).toBe(0);
    expect(api.tasks.delete).toHaveBeenCalledWith(task.id);
  });

  it('deleting a project unlinks associated tasks (projectId becomes empty)', async () => {
    const store = useTaskFlowStore.getState();
    const proj = await store.createProject({
      name: 'Project to Delete',
      color: '#6366f1',
    });

    await store.createTask({
      title: 'Task linked to project',
      priority: 'high',
      status: 'todo',
      projectId: proj.id,
      tags: [],
      subtasks: [],
    });

    expect(useTaskFlowStore.getState().tasks[0].projectId).toBe(proj.id);

    // Delete project
    await store.deleteProject(proj.id);

    // Project removed from projects array
    expect(useTaskFlowStore.getState().projects.find((p) => p.id === proj.id)).toBeUndefined();
    // Task is preserved, but unlinked
    expect(useTaskFlowStore.getState().tasks[0].projectId).toBe('');
  });

  it('correctly filters tasks by search query, priority, and status', async () => {
    const store = useTaskFlowStore.getState();

    await store.createTask({
      title: 'Algorithms Midterm Prep',
      description: 'Dynamic programming & graph traversal',
      priority: 'high',
      status: 'todo',
      projectId: '',
      tags: ['Exam'],
      subtasks: [],
    });

    await store.createTask({
      title: 'Campus Gym Workout',
      description: 'Cardio and weights',
      priority: 'low',
      status: 'completed',
      projectId: '',
      tags: ['Health'],
      subtasks: [],
    });

    // 1. Search Query
    store.setSearchQuery('Midterm');
    let filtered = store.getFilteredTasks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toContain('Algorithms');

    store.setSearchQuery('');

    // 2. Priority filter
    store.setPriorityFilter('high');
    filtered = store.getFilteredTasks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].priority).toBe('high');

    store.setPriorityFilter('all');

    // 3. Status filter
    store.setStatusFilter('completed');
    filtered = store.getFilteredTasks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Campus Gym Workout');
  });

  it('computes dashboard statistics accurately', async () => {
    const store = useTaskFlowStore.getState();

    await store.createTask({
      title: 'Task 1',
      priority: 'medium',
      status: 'completed',
      completedAt: '2026-09-14T10:00:00.000Z',
      projectId: '',
      tags: [],
      subtasks: [],
    });

    await store.createTask({
      title: 'Task 2',
      priority: 'medium',
      status: 'todo',
      projectId: '',
      tags: [],
      subtasks: [],
    });

    const stats = store.getDashboardStats();
    expect(stats.totalTasks).toBe(2);
    expect(stats.completedTasks).toBe(1);
    expect(stats.remainingTasks).toBe(1);
    expect(stats.completionRate).toBe(50);
  });

  describe('Reliable Operations & Rollback Scenarios', () => {
    it('rolls back temporary task when api.tasks.create fails', async () => {
      const store = useTaskFlowStore.getState();
      vi.mocked(api.tasks.create).mockRejectedValueOnce(new Error('Network error writing task'));

      await expect(
        store.createTask({
          title: 'Failing Task',
          priority: 'high',
          status: 'todo',
          projectId: '',
          tags: [],
          subtasks: [],
        })
      ).rejects.toThrow('Unable to save task. Please try again.');

      // Temporary task must NOT remain in store
      expect(useTaskFlowStore.getState().tasks.length).toBe(0);
      expect(useTaskFlowStore.getState().isCloudSynced).toBe(false);
      expect(useTaskFlowStore.getState().apiError).toBe('Unable to save task. Please try again.');
    });

    it('rolls back task updates when api.tasks.update fails', async () => {
      const store = useTaskFlowStore.getState();
      const task = await store.createTask({
        title: 'Original Title',
        priority: 'low',
        status: 'todo',
        projectId: '',
        tags: [],
        subtasks: [],
      });

      vi.mocked(api.tasks.update).mockRejectedValueOnce(new Error('Firestore update rejection'));

      await expect(
        store.updateTask(task.id, { title: 'New Bad Title', priority: 'high' })
      ).rejects.toThrow('Unable to update task. Please try again.');

      // State must be restored to original
      const restoredTask = useTaskFlowStore.getState().tasks.find((t) => t.id === task.id);
      expect(restoredTask?.title).toBe('Original Title');
      expect(restoredTask?.priority).toBe('low');
      expect(useTaskFlowStore.getState().isCloudSynced).toBe(false);
      expect(useTaskFlowStore.getState().apiError).toBe('Unable to update task. Please try again.');
    });

    it('restores task when api.tasks.delete fails', async () => {
      const store = useTaskFlowStore.getState();
      const task = await store.createTask({
        title: 'Undeletable Task',
        priority: 'medium',
        status: 'todo',
        projectId: '',
        tags: [],
        subtasks: [],
      });

      expect(useTaskFlowStore.getState().tasks.length).toBe(1);

      vi.mocked(api.tasks.delete).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(store.deleteTask(task.id)).rejects.toThrow('Unable to delete task. Please try again.');

      // Task must be restored back into store
      expect(useTaskFlowStore.getState().tasks.length).toBe(1);
      expect(useTaskFlowStore.getState().tasks[0].id).toBe(task.id);
      expect(useTaskFlowStore.getState().isCloudSynced).toBe(false);
      expect(useTaskFlowStore.getState().apiError).toBe('Unable to delete task. Please try again.');
    });

    it('restores project and original task projectIds when api.projects.delete fails', async () => {
      const store = useTaskFlowStore.getState();
      const proj = await store.createProject({
        name: 'Critical Project',
        color: '#ef4444',
      });

      const task = await store.createTask({
        title: 'Task in Critical Project',
        priority: 'high',
        status: 'todo',
        projectId: proj.id,
        tags: [],
        subtasks: [],
      });

      expect(useTaskFlowStore.getState().tasks[0].projectId).toBe(proj.id);
      expect(useTaskFlowStore.getState().projects.length).toBe(1);

      vi.mocked(api.projects.delete).mockRejectedValueOnce(new Error('Failed to delete project'));

      await expect(store.deleteProject(proj.id)).rejects.toThrow('Unable to delete project. Please try again.');

      // Project must be restored
      expect(useTaskFlowStore.getState().projects.some((p) => p.id === proj.id)).toBe(true);
      // Task must still be linked to the project
      const restoredTask = useTaskFlowStore.getState().tasks.find((t) => t.id === task.id);
      expect(restoredTask?.projectId).toBe(proj.id);
      expect(useTaskFlowStore.getState().isCloudSynced).toBe(false);
      expect(useTaskFlowStore.getState().apiError).toBe('Unable to delete project. Please try again.');
    });

    it('rolls back tag creation when api.tags.create fails', async () => {
      const store = useTaskFlowStore.getState();
      vi.mocked(api.tags.create).mockRejectedValueOnce(new Error('Failed to create tag'));

      await expect(
        store.createTag({ name: 'FailingTag', color: '#10b981' })
      ).rejects.toThrow('Unable to create tag. Please try again.');

      expect(useTaskFlowStore.getState().tags.length).toBe(0);
      expect(useTaskFlowStore.getState().isCloudSynced).toBe(false);
      expect(useTaskFlowStore.getState().apiError).toBe('Unable to create tag. Please try again.');
    });

    it('restores tag when api.tags.delete fails', async () => {
      const store = useTaskFlowStore.getState();
      const tag = await store.createTag({ name: 'PersistentTag', color: '#6366f1' });
      expect(useTaskFlowStore.getState().tags.length).toBe(1);

      vi.mocked(api.tags.delete).mockRejectedValueOnce(new Error('Failed to delete tag'));

      await expect(store.deleteTag(tag.id)).rejects.toThrow('Unable to delete tag. Please try again.');

      expect(useTaskFlowStore.getState().tags.length).toBe(1);
      expect(useTaskFlowStore.getState().tags[0].id).toBe(tag.id);
      expect(useTaskFlowStore.getState().isCloudSynced).toBe(false);
      expect(useTaskFlowStore.getState().apiError).toBe('Unable to delete tag. Please try again.');
    });
  });
});
