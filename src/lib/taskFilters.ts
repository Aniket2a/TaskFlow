import { Task, Project } from '../types';
import { formatDate } from './utils';

/**
 * Parses a task due date string or timestamp into a local midnight Date.
 * Properly accounts for local timezone differences so YYYY-MM-DD does not shift
 * to the previous day in western timezones.
 */
export function parseDueDateToLocalDate(dueDateStr?: string): Date | null {
  if (!dueDateStr) return null;
  const trimmed = dueDateStr.trim();
  if (!trimmed) return null;

  if (trimmed === 'Today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (trimmed === 'Tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Handle YYYY-MM-DD pattern explicitly in local timezone
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month, day, 0, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // Fallback to standard Date parsing
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
}

/**
 * Returns today's date set to local midnight 00:00:00.000
 */
export function getTodayDateLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Returns a date string formatted as YYYY-MM-DD in the user's local timezone.
 * Avoids the UTC-offset shift from toISOString().
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a task's due date corresponds to today in the local timezone.
 */
export function isTaskDueToday(dueDate?: string): boolean {
  const taskDate = parseDueDateToLocalDate(dueDate);
  if (!taskDate) return false;
  const today = getTodayDateLocal();
  return taskDate.getTime() === today.getTime();
}

/**
 * Checks if a task's due date is in the future (after today's local midnight).
 */
export function isTaskUpcoming(dueDate?: string): boolean {
  const taskDate = parseDueDateToLocalDate(dueDate);
  if (!taskDate) return false;
  const today = getTodayDateLocal();
  return taskDate.getTime() > today.getTime();
}

/**
 * Checks if an active task's due date is before today (overdue).
 * Completed tasks are never overdue.
 */
export function isTaskOverdue(dueDate?: string, status?: string): boolean {
  if (status === 'completed' || !dueDate) return false;
  const taskDate = parseDueDateToLocalDate(dueDate);
  if (!taskDate) return false;
  const today = getTodayDateLocal();
  return taskDate.getTime() < today.getTime();
}

/**
 * Returns structured due date badge/display information for tasks.
 */
export function getTaskDueDateBadgeInfo(task: Task) {
  const overdue = isTaskOverdue(task.dueDate, task.status);
  const today = task.status !== 'completed' && isTaskDueToday(task.dueDate);

  if (!task.dueDate) {
    return {
      label: 'No due date',
      ariaLabel: 'No due date',
      className: 'text-zinc-500 dark:text-zinc-400',
      isOverdue: false,
      isToday: false,
    };
  }

  const formattedDate = formatDate(task.dueDate);

  if (overdue) {
    return {
      label: `Overdue: ${formattedDate}`,
      ariaLabel: `Overdue, due on ${formattedDate}`,
      className: 'text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1',
      isOverdue: true,
      isToday: false,
    };
  }

  if (today) {
    const timeStr = task.dueTime ? ` at ${task.dueTime}` : '';
    return {
      label: `Today${timeStr}`,
      ariaLabel: `Due today${timeStr}`,
      className: 'text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-1',
      isOverdue: false,
      isToday: true,
    };
  }

  const timeStr = task.dueTime ? ` at ${task.dueTime}` : '';
  return {
    label: `${formattedDate}${timeStr}`,
    ariaLabel: `Due on ${formattedDate}${timeStr}`,
    className: 'text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1',
    isOverdue: false,
    isToday: false,
  };
}

/**
 * Sorts active tasks:
 * 1. Overdue active tasks first
 * 2. Today's active tasks second
 * 3. Future tasks sorted by nearest due date third
 * 4. Tasks without a due date after dated tasks
 * 5. Priority and creation date tie-breakers
 */
export function sortActiveTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const activeA = a.status !== 'completed';
    const activeB = b.status !== 'completed';
    if (activeA && !activeB) return -1;
    if (!activeA && activeB) return 1;

    const overdueA = isTaskOverdue(a.dueDate, a.status);
    const overdueB = isTaskOverdue(b.dueDate, b.status);
    if (overdueA && !overdueB) return -1;
    if (!overdueA && overdueB) return 1;

    const todayA = isTaskDueToday(a.dueDate) && activeA;
    const todayB = isTaskDueToday(b.dueDate) && activeB;
    if (todayA && !todayB) return -1;
    if (!todayA && todayB) return 1;

    const dateA = parseDueDateToLocalDate(a.dueDate)?.getTime();
    const dateB = parseDueDateToLocalDate(b.dueDate)?.getTime();

    if (dateA !== undefined && dateB !== undefined) {
      if (dateA !== dateB) return dateA - dateB;
    } else if (dateA !== undefined) {
      return -1;
    } else if (dateB !== undefined) {
      return 1;
    }

    const priorityWeights: Record<string, number> = { high: 1, medium: 2, low: 3 };
    const pA = priorityWeights[a.priority] || 99;
    const pB = priorityWeights[b.priority] || 99;
    if (pA !== pB) return pA - pB;

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Inbox tasks: All active (non-completed) tasks.
 */
export function getInboxTasks(tasks: Task[]): Task[] {
  return sortActiveTasks(tasks.filter((t) => t.status !== 'completed'));
}

/**
 * My tasks (for Overview dashboard): All active (non-completed) tasks.
 */
export function getMyTasks(tasks: Task[]): Task[] {
  return sortActiveTasks(tasks.filter((t) => t.status !== 'completed'));
}

/**
 * Today tasks: All active tasks scheduled/due for today.
 * Only shows tasks whose due date is today.
 * Excludes completed tasks.
 * Excludes future tasks and tasks without due date.
 */
export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status !== 'completed' && isTaskDueToday(t.dueDate));
}

/**
 * Upcoming tasks: All active tasks with a future scheduled/due date.
 * Excludes tasks with no due date.
 * Excludes completed tasks.
 * Sorts by nearest due date first.
 * Does not include today's tasks.
 */
export function getUpcomingTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status !== 'completed' && isTaskUpcoming(t.dueDate))
    .sort((a, b) => {
      const dateA = parseDueDateToLocalDate(a.dueDate)?.getTime() ?? Infinity;
      const dateB = parseDueDateToLocalDate(b.dueDate)?.getTime() ?? Infinity;
      if (dateA !== dateB) return dateA - dateB;
      const priorityWeights: Record<string, number> = { high: 1, medium: 2, low: 3 };
      return (priorityWeights[a.priority] || 99) - (priorityWeights[b.priority] || 99);
    });
}

/**
 * Completed tasks: All completed tasks.
 * Sorts newest recently completed first where completion date exists.
 * Does not mix active tasks into this view.
 */
export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => {
      const timeA = a.completedAt
        ? new Date(a.completedAt).getTime()
        : (a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      const timeB = b.completedAt
        ? new Date(b.completedAt).getTime()
        : (b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
      const safeTimeA = isNaN(timeA) ? 0 : timeA;
      const safeTimeB = isNaN(timeB) ? 0 : timeB;
      return safeTimeB - safeTimeA;
    });
}

/**
 * Calculates current streak in consecutive calendar days up to the reference date (today).
 *
 * Rules:
 * - Current streak means consecutive calendar days ending today on which the user completed at least one task.
 * - Completed today + yesterday + day before yesterday = streak 3.
 * - Completed today only = streak 1.
 * - Completed yesterday but nothing today = current streak is 0.
 * - Two completed tasks on the same day count as ONE day.
 * - Missing a calendar day breaks the streak.
 * - Uses completedAt dates rather than counting total completed tasks.
 * - Handles local calendar dates consistently avoiding timestamp/timezone bugs.
 */
export function calculateCurrentStreak(tasks: Task[], referenceDate?: Date): number {
  const completedLocalDates = new Set<string>();

  for (const task of tasks) {
    if (task.status === 'completed' && task.completedAt) {
      const d = new Date(task.completedAt);
      if (!isNaN(d.getTime())) {
        completedLocalDates.add(getLocalDateString(d));
      }
    }
  }

  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getLocalDateString(today);

  // If no task was completed today, current streak is 0
  if (!completedLocalDates.has(todayStr)) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const cursorStr = getLocalDateString(cursor);
    if (completedLocalDates.has(cursorStr)) {
      streak += 1;
      // Step back one calendar day in local time
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Project tasks: All tasks belonging to a specific project.
 */
export function getProjectTasks(tasks: Task[], projectId: string): Task[] {
  const projTasks = tasks.filter((t) => t.projectId === projectId);
  const active = projTasks.filter((t) => t.status !== 'completed');
  const completed = projTasks.filter((t) => t.status === 'completed');
  return [...sortActiveTasks(active), ...completed];
}

export interface TaskDateGroup {
  label: string;
  dateKey: string;
  tasks: Task[];
}

/**
 * Groups upcoming tasks into date sections (e.g. Tomorrow, specific weekday, Next Week).
 */
export function groupUpcomingTasks(upcomingTasks: Task[]): TaskDateGroup[] {
  const groups: Record<string, { label: string; dateKey: string; tasks: Task[] }> = {};
  const today = getTodayDateLocal();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() + 7);

  upcomingTasks.forEach((task) => {
    const taskDate = parseDueDateToLocalDate(task.dueDate);
    if (!taskDate) return;

    let label = '';
    const dateKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

    if (taskDate.getTime() === tomorrow.getTime()) {
      label = 'Tomorrow';
    } else if (taskDate.getTime() < nextWeekStart.getTime()) {
      label = taskDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } else {
      label = `Next Week & Beyond (${taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }

    if (!groups[label]) {
      groups[label] = { label, dateKey, tasks: [] };
    }
    groups[label].tasks.push(task);
  });

  return Object.values(groups);
}

/**
 * Computes dynamic task counts for sidebar badges from real authenticated tasks.
 */
export function getSidebarCounts(tasks: Task[]) {
  return {
    inbox: getInboxTasks(tasks).length,
    today: getTodayTasks(tasks).length,
    upcoming: getUpcomingTasks(tasks).length,
    completed: getCompletedTasks(tasks).length,
  };
}

/**
 * Applies search query, priority, tag, and status filters to any task list.
 */
export function filterTasksWithSecondaryFilters(
  tasks: Task[],
  filters: {
    searchQuery?: string;
    priorityFilter?: string;
    tagFilter?: string;
    statusFilter?: string;
  },
  projects: Project[] = []
): Task[] {
  return tasks.filter((task) => {
    // 1. Search Query (title, description, project/workspace name, tag name)
    // Case-insensitive and whitespace-tolerant
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
      const title = (task.title || '').toLowerCase();
      const desc = (task.description || '').toLowerCase();
      const tags = (task.tags || []).map((t) => t.toLowerCase());
      const project = projects.find((p) => p.id === task.projectId);
      const projectName = (project?.name || '').toLowerCase();

      const combined = `${title} ${desc} ${projectName} ${tags.join(' ')}`.replace(/\s+/g, ' ');
      const words = q.split(' ').filter(Boolean);
      const matchesAllWords = words.every((word) => combined.includes(word));
      const matchesSubstring = combined.includes(q);

      if (!matchesSubstring && !matchesAllWords) return false;
    }

    // 2. Priority Filter (AND logic)
    if (filters.priorityFilter && filters.priorityFilter !== 'all') {
      if (task.priority !== filters.priorityFilter) return false;
    }

    // 3. Tag Filter (AND logic)
    if (filters.tagFilter && filters.tagFilter !== 'all') {
      if (!(task.tags || []).includes(filters.tagFilter)) return false;
    }

    // 4. Status Filter (AND logic)
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      if (task.status !== filters.statusFilter) return false;
    }

    return true;
  });
}
