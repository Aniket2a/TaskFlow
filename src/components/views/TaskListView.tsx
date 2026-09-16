import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Folder,
  ChevronDown,
  ChevronRight,
  Inbox,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { formatDate, cn } from '../../lib/utils';
import { Task, TaskPriority } from '../../types';
import {
  getInboxTasks,
  getTodayTasks,
  getUpcomingTasks,
  getCompletedTasks,
  getProjectTasks,
  filterTasksWithSecondaryFilters,
  groupUpcomingTasks,
  getTaskDueDateBadgeInfo,
} from '../../lib/taskFilters';

interface TaskListViewProps {
  viewType?: 'inbox' | 'today' | 'upcoming' | 'completed' | 'project';
}

export const TaskListView: React.FC<TaskListViewProps> = ({ viewType: propViewType }) => {
  const location = useLocation();
  const params = useParams<{ projectId?: string }>();

  const {
    tasks,
    projects,
    activeTab,
    selectedProjectId,
    isLoading,
    apiError,
    loadUserData,
    toggleTaskStatus,
    toggleSubTask,
    deleteTask,
    setTaskModalOpen,
    searchQuery,
    selectedPriorityFilter,
    setPriorityFilter,
    selectedStatusFilter,
    setStatusFilter,
    tags,
    selectedTagFilter,
    setTagFilter,
    resetFilters,
  } = useTaskFlowStore();

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedPriorityFilter !== 'all' ||
      selectedTagFilter !== 'all' ||
      selectedStatusFilter !== 'all'
  );

  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Determine effective view type from prop, path, or store
  let currentView = propViewType;
  if (!currentView) {
    const path = location.pathname.replace(/^\//, '');
    if (path.startsWith('project/')) {
      currentView = 'project';
    } else if (['inbox', 'today', 'upcoming', 'completed', 'project'].includes(path)) {
      currentView = path as 'inbox' | 'today' | 'upcoming' | 'completed' | 'project';
    } else if (['inbox', 'today', 'upcoming', 'completed', 'project'].includes(activeTab)) {
      currentView = activeTab as 'inbox' | 'today' | 'upcoming' | 'completed' | 'project';
    } else {
      currentView = 'inbox';
    }
  }

  const effectiveProjectId = params.projectId || selectedProjectId;
  const currentProject = effectiveProjectId
    ? projects.find((p) => p.id === effectiveProjectId)
    : null;

  // 1. Get base tasks for this specific view using reusable filters
  let baseTasks: Task[] = [];
  if (currentView === 'project' && effectiveProjectId) {
    baseTasks = getProjectTasks(tasks, effectiveProjectId);
  } else if (currentView === 'today') {
    baseTasks = getTodayTasks(tasks);
  } else if (currentView === 'upcoming') {
    baseTasks = getUpcomingTasks(tasks);
  } else if (currentView === 'completed') {
    baseTasks = getCompletedTasks(tasks);
  } else {
    // Inbox is default
    baseTasks = getInboxTasks(tasks);
  }

  // 2. Apply search query, priority filter, tag filter, and status filter
  const filteredTasks = filterTasksWithSecondaryFilters(
    baseTasks,
    {
      searchQuery,
      priorityFilter: selectedPriorityFilter,
      tagFilter: selectedTagFilter,
      statusFilter: currentView === 'completed' ? undefined : selectedStatusFilter,
    },
    projects
  );

  // Dynamic headers and empty states
  let viewTitle = 'Inbox';
  let viewSubtitle = 'All active tasks and backlog items';
  let emptyTitle = 'No tasks in your inbox';
  let emptySubtitle = 'All caught up! Create a new task or adjust your active filters.';
  let EmptyIcon = Inbox;

  if (hasActiveFilters) {
    emptyTitle = 'No tasks match your current search or filters.';
    emptySubtitle = 'Try adjusting your search query, priority, tag, or status filters, or clear them to view all tasks.';
    EmptyIcon = Filter;
  } else if (currentView === 'project' && currentProject) {
    viewTitle = currentProject.name;
    viewSubtitle = currentProject.description || 'Project tasks and milestones';
    emptyTitle = 'No tasks in this workspace';
    emptySubtitle = 'Create a task and assign it to this workspace to get started.';
    EmptyIcon = Folder;
  } else if (currentView === 'today') {
    viewTitle = 'Today';
    viewSubtitle = "Tasks scheduled for today's focus session";
    emptyTitle = "You're all caught up!";
    emptySubtitle = 'No tasks scheduled for today. Enjoy your day or plan ahead!';
    EmptyIcon = Calendar;
  } else if (currentView === 'upcoming') {
    viewTitle = 'Upcoming';
    viewSubtitle = 'Upcoming deadlines across this week and beyond';
    emptyTitle = 'No upcoming tasks';
    emptySubtitle = 'No deadlines on the horizon. Schedule tasks to stay ahead.';
    EmptyIcon = CalendarDays;
  } else if (currentView === 'completed') {
    viewTitle = 'Completed Tasks';
    viewSubtitle = 'Archive of finished assignments and accomplishments';
    emptyTitle = 'No completed tasks yet';
    emptySubtitle = 'When you mark tasks as done, they will be archived here.';
    EmptyIcon = CheckCircle2;
  }

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'default';
    }
  };

  // Grouping for Upcoming view
  const isUpcomingGrouped = currentView === 'upcoming' && !searchQuery.trim();
  const upcomingGroups = isUpcomingGrouped ? groupUpcomingTasks(filteredTasks) : [];

  const renderTaskItem = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const project = projects.find((p) => p.id === task.projectId);
    const isExpanded = !!expandedTaskIds[task.id];
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

    return (
      <div
        key={task.id}
        className="group p-4 flex items-start gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
      >
        <div className="pt-0.5">
          <Checkbox
            id={`task-view-check-${task.id}`}
            checked={isCompleted}
            onChange={() => toggleTaskStatus(task.id)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setTaskModalOpen(true, task)}
            >
              <span
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  isCompleted
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {task.title}
              </span>

              {task.description && (
                <p
                  className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                    isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-500'
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                {task.priority}
              </Badge>

              <button
                onClick={() => setTaskModalOpen(true, task)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer transition-opacity"
                title="Edit Task"
                aria-label="Edit Task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer transition-opacity"
                title="Delete Task"
                aria-label="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-zinc-500">
            {project && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </span>
            )}

            {task.dueDate && (() => {
              const info = getTaskDueDateBadgeInfo(task);
              const Icon = info.isOverdue ? AlertCircle : Calendar;
              return (
                <span
                  className={info.className}
                  aria-label={info.ariaLabel}
                >
                  <Icon className={cn("w-3 h-3 shrink-0", info.isOverdue ? "text-rose-500" : "text-zinc-400")} />
                  {info.label}
                </span>
              );
            })()}

            {isCompleted && task.completedAt && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                Completed {formatDate(task.completedAt)}
              </span>
            )}

            {task.tags &&
              task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  #{tag}
                </span>
              ))}

            {hasSubtasks && (
              <button
                onClick={() => toggleExpand(task.id)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 ml-auto cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>
                  {completedSubtasks}/{task.subtasks?.length} subtasks
                </span>
              </button>
            )}
          </div>

          {hasSubtasks && isExpanded && (
            <div className="mt-2.5 pl-3 pt-2 border-l-2 border-indigo-100 dark:border-indigo-950/60 space-y-1.5">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <Checkbox
                    id={`subtask-check-list-${subtask.id}`}
                    checked={subtask.completed}
                    onChange={() => toggleSubTask(task.id, subtask.id)}
                  />
                  <span
                    className={subtask.completed ? 'line-through text-zinc-400' : ''}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {currentProject && (
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: currentProject.color }}
              />
            )}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {viewTitle}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {filteredTasks.length}
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{viewSubtitle}</p>
        </div>

        <Button
          id="view-create-task-btn"
          onClick={() => setTaskModalOpen(true)}
          size="md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2.5 flex-wrap pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {currentView !== 'completed' && (
          <select
            id="status-filter"
            value={selectedStatusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter by status"
            className="text-xs py-1 px-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}

        <select
          id="view-priority-filter"
          value={selectedPriorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          aria-label="Filter by priority"
          className="text-xs py-1 px-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          id="view-tag-filter"
          value={selectedTagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          aria-label="Filter by tag"
          className="text-xs py-1 px-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="all">All Tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>
              #{t.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => resetFilters()}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-auto font-medium cursor-pointer"
            id="clear-filters-btn"
          >
            Clear Filters & Search
          </button>
        )}
      </div>

      {/* Async Loading State */}
      {isLoading && tasks.length === 0 ? (
        <Card className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Loading tasks...
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Loading your cloud workspace data...
          </p>
        </Card>
      ) : apiError && tasks.length === 0 ? (
        /* Async Error State */
        <Card className="py-16 text-center border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Unable to load your tasks.
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
            {apiError}
          </p>
          <Button onClick={() => loadUserData()} variant="outline" size="sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Retry</span>
          </Button>
        </Card>
      ) : filteredTasks.length === 0 ? (
        /* Empty State */
        <Card className="py-16 text-center">
          <EmptyIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {emptyTitle}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {emptySubtitle}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {hasActiveFilters && (
              <Button
                id="empty-clear-filters-btn"
                onClick={() => resetFilters()}
                variant="outline"
                size="sm"
              >
                Clear Filters & Search
              </Button>
            )}
            <Button
              id="empty-create-task-btn"
              onClick={() => setTaskModalOpen(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </Button>
          </div>
        </Card>
      ) : isUpcomingGrouped && upcomingGroups.length > 0 ? (
        /* Upcoming Grouped Sections */
        <div className="space-y-6">
          {upcomingGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {group.label}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {group.tasks.length}
                </span>
              </div>
              <Card className="p-0 overflow-hidden divide-y divide-zinc-200/60 dark:divide-zinc-800">
                {group.tasks.map(renderTaskItem)}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Flat Task List */
        <Card className="p-0 overflow-hidden divide-y divide-zinc-200/60 dark:divide-zinc-800">
          {filteredTasks.map(renderTaskItem)}
        </Card>
      )}
    </div>
  );
};
