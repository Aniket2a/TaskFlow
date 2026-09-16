import { create } from 'zustand';
import { api, ApiError } from '../services/api';
import { logOut } from '../lib/firebase';
import {
  DashboardStats,
  NavigationTab,
  Project,
  Tag,
  Task,
  TaskPriority,
  TaskStatus,
  UserProfile,
} from '../types';
import {
  isTaskDueToday,
  isTaskUpcoming,
  getTodayTasks as extractTodayTasks,
  getUpcomingTasks as extractUpcomingTasks,
  getInboxTasks as extractInboxTasks,
  getCompletedTasks as extractCompletedTasks,
  getMyTasks as extractMyTasks,
  calculateCurrentStreak,
  filterTasksWithSecondaryFilters,
} from '../lib/taskFilters';

export const THEME_STORAGE_KEY = 'taskflow_theme_preference';

export const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Ignore localStorage read errors
    }
  }
  return 'system';
};

export const applyThemeToDOM = (theme: 'light' | 'dark' | 'system') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

interface TaskFlowState {
  // Core Data Collections (User-scoped, empty initially)
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  user: UserProfile | null;

  // Async & Sync Status
  isLoading: boolean;
  isInitialLoadDone: boolean;
  apiError: string | null;
  isCloudSynced: boolean;
  syncNotice: string | null;

  // Navigation & Filtering
  activeTab: NavigationTab;
  selectedProjectId: string | null;
  searchQuery: string;
  selectedPriorityFilter: TaskPriority | 'all';
  selectedTagFilter: string | 'all';
  selectedStatusFilter: TaskStatus | 'all';

  // UI Modals & Layout
  isAuthModalOpen: boolean;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  isProjectModalOpen: boolean;
  editingProject: Project | null;
  isCommandPaletteOpen: boolean;
  isMobileSidebarOpen: boolean;
  isDesktopSidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';

  // State Mutators & Actions
  setUser: (user: UserProfile | null) => void;
  loadUserData: () => Promise<void>;
  setAuthModalOpen: (isOpen: boolean) => void;
  setTaskModalOpen: (isOpen: boolean, taskToEdit?: Task | null) => void;
  setProjectModalOpen: (isOpen: boolean, projectToEdit?: Project | null) => void;
  setCloudSynced: (synced: boolean) => void;
  setSyncNotice: (notice: string | null) => void;
  setApiError: (error: string | null) => void;
  handleSignOut: () => Promise<void>;

  // Task CRUD via Centralized API
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  addSubTask: (taskId: string, title: string) => Promise<void>;
  toggleSubTask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubTask: (taskId: string, subtaskId: string) => Promise<void>;

  // Project CRUD via Centralized API
  createProject: (projectData: Omit<Project, 'id'>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Tag CRUD via Centralized API
  createTag: (tagData: Omit<Tag, 'id'>) => Promise<Tag>;
  deleteTag: (tagId: string) => Promise<void>;

  // Layout & Filter setters
  setActiveTab: (tab: NavigationTab) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: TaskPriority | 'all') => void;
  setTagFilter: (tag: string | 'all') => void;
  setStatusFilter: (status: TaskStatus | 'all') => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  toggleDesktopSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resetFilters: () => void;

  // Derived Selectors
  getDashboardStats: () => DashboardStats;
  getFilteredTasks: () => Task[];
  getTodayTasks: () => Task[];
  getMyTasks: () => Task[];
  getProjectStats: (projectId: string) => { total: number; completed: number; rate: number };
}

export const useTaskFlowStore = create<TaskFlowState>((set, get) => ({
  // Clean, production initial state - NEVER populated with fake mock user data
  tasks: [],
  projects: [],
  tags: [],
  user: null,

  isLoading: false,
  isInitialLoadDone: false,
  apiError: null,
  isCloudSynced: false,
  syncNotice: null,

  activeTab: 'overview',
  selectedProjectId: null,
  searchQuery: '',
  selectedPriorityFilter: 'all',
  selectedTagFilter: 'all',
  selectedStatusFilter: 'all',

  isAuthModalOpen: false,
  isTaskModalOpen: false,
  editingTask: null,
  isProjectModalOpen: false,
  editingProject: null,
  isCommandPaletteOpen: false,
  isMobileSidebarOpen: false,
  isDesktopSidebarCollapsed: false,
  theme: getInitialTheme(),

  setUser: (user) => {
    set({ user });
    if (user) {
      get().loadUserData();
    } else {
      set({ tasks: [], projects: [], tags: [], isCloudSynced: false, isInitialLoadDone: true });
    }
  },

  loadUserData: async () => {
    const { user } = get();
    if (!user) {
      set({ tasks: [], projects: [], tags: [], isInitialLoadDone: true, isLoading: false });
      return;
    }

    set({ isLoading: true, apiError: null });

    try {
      // Parallel loading with resilient error isolation
      const [tasksResult, projectsResult, tagsResult] = await Promise.allSettled([
        api.tasks.list(user.id),
        api.projects.list(user.id),
        api.tags.list(user.id),
      ]);

      const loadedTasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
      const loadedProjects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
      const loadedTags = tagsResult.status === 'fulfilled' ? tagsResult.value : [];

      let errorMsg: string | null = null;
      if (tasksResult.status === 'rejected') {
        console.warn('Tasks load warning:', tasksResult.reason);
        errorMsg = 'Unable to load tasks from server.';
      } else if (projectsResult.status === 'rejected') {
        console.warn('Projects load warning:', projectsResult.reason);
        errorMsg = 'Unable to load workspaces from server.';
      } else if (tagsResult.status === 'rejected') {
        console.warn('Tags load warning:', tagsResult.reason);
      }

      set({
        tasks: loadedTasks || [],
        projects: loadedProjects || [],
        tags: loadedTags || [],
        isLoading: false,
        isInitialLoadDone: true,
        isCloudSynced: !errorMsg,
        apiError: errorMsg,
      });
    } catch (err: any) {
      console.error('Error loading user data:', err);
      set({
        isLoading: false,
        isInitialLoadDone: true,
        isCloudSynced: false,
        apiError: err?.message || 'Unable to load user data.',
      });
    }
  },

  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),

  setTaskModalOpen: (isOpen, taskToEdit = null) =>
    set({ isTaskModalOpen: isOpen, editingTask: taskToEdit }),

  setProjectModalOpen: (isOpen, projectToEdit = null) =>
    set({ isProjectModalOpen: isOpen, editingProject: projectToEdit }),

  setCloudSynced: (synced) => set({ isCloudSynced: synced }),

  setSyncNotice: (notice) => set({ syncNotice: notice }),

  setApiError: (error) => set({ apiError: error }),

  handleSignOut: async () => {
    try {
      await logOut();
      set({
        user: null,
        tasks: [],
        projects: [],
        tags: [],
        isCloudSynced: false,
        syncNotice: null,
        apiError: null,
      });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  },

  createTask: async (taskData) => {
    const { user } = get();
    if (!user) {
      const err = new Error('You must be signed in to create a task.');
      set({ apiError: err.message, isCloudSynced: false });
      throw err;
    }

    const tempId = `temp_task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticTask: Task = {
      id: tempId,
      userId: user.id,
      title: taskData.title ? taskData.title.trim() : 'Untitled',
      description: taskData.description ? taskData.description.trim() : '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId ? taskData.projectId.trim() : '',
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      dueDate: taskData.dueDate ? taskData.dueDate.trim() : undefined,
      dueTime: taskData.dueTime ? taskData.dueTime.trim() : undefined,
      recurrence: taskData.recurrence || 'none',
      subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically insert temporary task into Zustand store
    set((state) => ({
      tasks: [optimisticTask, ...state.tasks],
      apiError: null,
    }));

    try {
      // Create Firestore document and wait for confirmed write
      const serverTask = await api.tasks.create(taskData, user.id);

      // Replace temporary task with confirmed server task
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? serverTask : t)),
        isCloudSynced: true,
        syncNotice: 'Task saved successfully',
        apiError: null,
      }));

      setTimeout(() => {
        if (get().syncNotice === 'Task saved successfully') {
          set({ syncNotice: null });
        }
      }, 3000);
      return serverTask;
    } catch (err: any) {
      console.error('Task persistence failed:', err);
      // Rollback: REMOVE the temporary task from the Zustand store
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== tempId),
        isCloudSynced: false,
        apiError: 'Unable to save task. Please try again.',
        syncNotice: null,
      }));
      throw new Error('Unable to save task. Please try again.');
    }
  },

  updateTask: async (taskId, updates) => {
    const originalTask = get().tasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ),
      apiError: null,
    }));

    try {
      const updatedTask = await api.tasks.update(taskId, updates);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
        isCloudSynced: true,
        apiError: null,
      }));
    } catch (err: any) {
      console.error('Task update failed:', err);
      set({
        tasks: previousTasks,
        isCloudSynced: false,
        apiError: 'Unable to update task. Please try again.',
      });
      throw new Error('Unable to update task. Please try again.');
    }
  },

  deleteTask: async (taskId) => {
    const originalTask = get().tasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      apiError: null,
    }));

    try {
      await api.tasks.delete(taskId);
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Task deletion failed:', err);
      set({
        tasks: previousTasks,
        isCloudSynced: false,
        apiError: 'Unable to delete task. Please try again.',
      });
      throw new Error('Unable to delete task. Please try again.');
    }
  },

  toggleTaskStatus: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousTasks = get().tasks;
    const willBeCompleted = task.status !== 'completed';
    const newStatus: TaskStatus = willBeCompleted ? 'completed' : 'todo';
    const completedAt = willBeCompleted ? new Date().toISOString() : undefined;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt,
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
      apiError: null,
    }));

    try {
      await api.tasks.update(taskId, {
        status: newStatus,
        completedAt: completedAt || '',
      });
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Status toggle failed:', err);
      set({
        tasks: previousTasks,
        isCloudSynced: false,
        apiError: 'Unable to update task status. Please try again.',
      });
    }
  },

  addSubTask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousTasks = get().tasks;
    const newSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      completed: false,
    };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() }
          : t
      ),
      apiError: null,
    }));

    try {
      await api.tasks.update(taskId, { subtasks: updatedSubtasks });
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Subtask add failed:', err);
      set({
        tasks: previousTasks,
        isCloudSynced: false,
        apiError: 'Unable to add subtask. Please try again.',
      });
    }
  },

  toggleSubTask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const previousTasks = get().tasks;
    const updatedSubtasks = task.subtasks.map((sub) =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() }
          : t
      ),
      apiError: null,
    }));

    try {
      await api.tasks.update(taskId, { subtasks: updatedSubtasks });
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Subtask toggle failed:', err);
      set({
        tasks: previousTasks,
        isCloudSynced: false,
        apiError: 'Unable to update subtask. Please try again.',
      });
    }
  },

  deleteSubTask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const previousTasks = get().tasks;
    const updatedSubtasks = task.subtasks.filter((sub) => sub.id !== subtaskId);

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() }
          : t
      ),
      apiError: null,
    }));

    try {
      await api.tasks.update(taskId, { subtasks: updatedSubtasks });
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Subtask delete failed:', err);
      set({
        tasks: previousTasks,
        isCloudSynced: false,
        apiError: 'Unable to delete subtask. Please try again.',
      });
    }
  },

  createProject: async (projectData) => {
    const tempId = `temp_proj_${Date.now()}`;
    const optimisticProject: Project = { ...projectData, id: tempId };

    set((state) => ({
      projects: [...state.projects, optimisticProject],
      apiError: null,
    }));

    try {
      const serverProject = await api.projects.create(projectData);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === tempId ? serverProject : p)),
        isCloudSynced: true,
        apiError: null,
      }));
      return serverProject;
    } catch (err: any) {
      console.error('Project create failed:', err);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== tempId),
        isCloudSynced: false,
        apiError: 'Unable to create project. Please try again.',
      }));
      throw new Error('Unable to create project. Please try again.');
    }
  },

  updateProject: async (projectId, updates) => {
    const originalProject = get().projects.find((p) => p.id === projectId);
    if (!originalProject) return;

    const previousProjects = get().projects;

    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
      apiError: null,
    }));

    try {
      const serverProject = await api.projects.update(projectId, updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? serverProject : p)),
        isCloudSynced: true,
        apiError: null,
      }));
    } catch (err: any) {
      console.error('Project update failed:', err);
      set({
        projects: previousProjects,
        isCloudSynced: false,
        apiError: 'Unable to update project. Please try again.',
      });
      throw new Error('Unable to update project. Please try again.');
    }
  },

  deleteProject: async (projectId) => {
    const previousProjects = get().projects;
    const previousTasks = get().tasks;
    const previousSelectedProjectId = get().selectedProjectId;
    const previousActiveTab = get().activeTab;

    // Optimistically update: remove project from list, switch view if active, unlink tasks
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
      activeTab: state.selectedProjectId === projectId ? 'overview' : state.activeTab,
      tasks: state.tasks.map((t) => (t.projectId === projectId ? { ...t, projectId: '' } : t)),
      apiError: null,
    }));

    try {
      await api.projects.delete(projectId);
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Project delete failed:', err);
      // Rollback: restore project, tasks, selected project, and active tab
      set({
        projects: previousProjects,
        tasks: previousTasks,
        selectedProjectId: previousSelectedProjectId,
        activeTab: previousActiveTab,
        isCloudSynced: false,
        apiError: 'Unable to delete project. Please try again.',
      });
      throw new Error('Unable to delete project. Please try again.');
    }
  },

  createTag: async (tagData) => {
    const tempId = `temp_tag_${Date.now()}`;
    const optimisticTag: Tag = { ...tagData, id: tempId };

    set((state) => ({
      tags: [...state.tags, optimisticTag],
      apiError: null,
    }));

    try {
      const serverTag = await api.tags.create(tagData);
      set((state) => ({
        tags: state.tags.map((t) => (t.id === tempId ? serverTag : t)),
        isCloudSynced: true,
        apiError: null,
      }));
      return serverTag;
    } catch (err: any) {
      console.error('Tag create failed:', err);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== tempId),
        isCloudSynced: false,
        apiError: 'Unable to create tag. Please try again.',
      }));
      throw new Error('Unable to create tag. Please try again.');
    }
  },

  deleteTag: async (tagId) => {
    const previousTags = get().tags;

    set((state) => ({
      tags: state.tags.filter((t) => t.id !== tagId),
      apiError: null,
    }));

    try {
      await api.tags.delete(tagId);
      set({ isCloudSynced: true, apiError: null });
    } catch (err: any) {
      console.error('Tag delete failed:', err);
      set({
        tags: previousTags,
        isCloudSynced: false,
        apiError: 'Unable to delete tag. Please try again.',
      });
      throw new Error('Unable to delete tag. Please try again.');
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedProject: (projectId) =>
    set({
      selectedProjectId: projectId,
      activeTab: projectId ? 'project' : 'overview',
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setPriorityFilter: (priority) => set({ selectedPriorityFilter: priority }),

  setTagFilter: (tag) => set({ selectedTagFilter: tag }),

  setStatusFilter: (status) => set({ selectedStatusFilter: status }),

  resetFilters: () =>
    set({
      searchQuery: '',
      selectedPriorityFilter: 'all',
      selectedTagFilter: 'all',
      selectedStatusFilter: 'all',
    }),

  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),

  toggleDesktopSidebar: () =>
    set((state) => ({ isDesktopSidebarCollapsed: !state.isDesktopSidebarCollapsed })),

  setTheme: (theme) => {
    set({ theme });
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch {
      // Ignore storage write errors
    }
    applyThemeToDOM(theme);
  },

  getDashboardStats: () => {
    const { tasks } = get();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const remainingTasks = tasks.filter((t) => t.status !== 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const streakDays = calculateCurrentStreak(tasks);

    return {
      totalTasks,
      completedTasks,
      remainingTasks,
      completionRate,
      streakDays,
    };
  },

  getFilteredTasks: () => {
    const {
      tasks,
      projects,
      activeTab,
      selectedProjectId,
      searchQuery,
      selectedPriorityFilter,
      selectedTagFilter,
      selectedStatusFilter,
    } = get();

    // 1. Base scoping according to activeTab
    let baseTasks: Task[] = [];
    if (selectedProjectId || activeTab === 'project') {
      baseTasks = selectedProjectId ? tasks.filter((t) => t.projectId === selectedProjectId) : tasks;
    } else if (activeTab === 'inbox') {
      baseTasks = extractInboxTasks(tasks);
    } else if (activeTab === 'today') {
      baseTasks = extractTodayTasks(tasks);
    } else if (activeTab === 'upcoming') {
      baseTasks = extractUpcomingTasks(tasks);
    } else if (activeTab === 'completed') {
      baseTasks = extractCompletedTasks(tasks);
    } else {
      // Overview or default
      baseTasks = selectedStatusFilter === 'completed'
        ? tasks
        : extractMyTasks(tasks);
    }

    // 2. Secondary search and filters
    return filterTasksWithSecondaryFilters(
      baseTasks,
      {
        searchQuery,
        priorityFilter: selectedPriorityFilter,
        tagFilter: selectedTagFilter,
        statusFilter: activeTab === 'completed' ? undefined : selectedStatusFilter,
      },
      projects
    );
  },

  getTodayTasks: () => {
    const { tasks } = get();
    return extractTodayTasks(tasks);
  },

  getMyTasks: () => {
    const { tasks } = get();
    return extractMyTasks(tasks);
  },

  getProjectStats: (projectId) => {
    const { tasks } = get();
    const projTasks = tasks.filter((t) => t.projectId === projectId);
    const total = projTasks.length;
    const completed = projTasks.filter((t) => t.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  },
}));
