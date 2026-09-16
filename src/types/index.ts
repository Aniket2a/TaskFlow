export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  tags: string[];
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // e.g. "16:00" or "4:00 PM"
  recurrence?: RecurrenceType;
  subtasks?: SubTask[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string; // e.g. hex or tailwind badge color
  icon?: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export type NavigationTab = 'overview' | 'inbox' | 'today' | 'upcoming' | 'completed' | 'project' | 'settings';

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionRate: number; // percentage 0-100
  streakDays: number;
}
