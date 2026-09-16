import React, { useState } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle,
  Filter,
  Check,
  Plus,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Task, TaskPriority } from '../../types';
import { cn } from '../../lib/utils';
import {
  filterTasksWithSecondaryFilters,
  getTaskDueDateBadgeInfo,
  getLocalDateString,
} from '../../lib/taskFilters';

export const TodayTasksList: React.FC = () => {
  const {
    tasks,
    getMyTasks,
    toggleTaskStatus,
    toggleSubTask,
    deleteTask,
    setTaskModalOpen,
    projects,
    selectedPriorityFilter,
    setPriorityFilter,
    selectedTagFilter,
    setTagFilter,
    tags,
    searchQuery,
    selectedStatusFilter,
    setStatusFilter,
    resetFilters,
  } = useTaskFlowStore();

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedPriorityFilter !== 'all' ||
      selectedTagFilter !== 'all' ||
      selectedStatusFilter !== 'all'
  );

  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Show all active (non-completed) tasks or tasks based on status
  const allActiveTasks = getMyTasks();

  // Apply search, priority, tag, and status filters
  const displayedTasks = filterTasksWithSecondaryFilters(
    allActiveTasks,
    {
      searchQuery,
      priorityFilter: selectedPriorityFilter,
      tagFilter: selectedTagFilter,
      statusFilter: selectedStatusFilter,
    },
    projects
  );

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

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



  return (
    <Card className="p-0 overflow-hidden">
      {/* List Header & Inline Filters */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            My Tasks
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {displayedTasks.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            All active tasks across your workspaces
          </p>
        </div>

        {/* Priority & Tag Quick Filter Pills & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
          </div>
          <select
            id="priority-filter-select"
            value={selectedPriorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            aria-label="Filter by priority"
            className="text-xs py-1 px-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            id="tag-filter-select"
            value={selectedTagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filter by tag"
            className="text-xs py-1 px-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => resetFilters()}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              id="today-clear-filters-btn"
            >
              Clear Filters
            </button>
          )}

          <Button
            id="today-add-task-btn"
            size="sm"
            onClick={() => setTaskModalOpen(true)}
            className="h-7 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      {/* Task List Items */}
      {displayedTasks.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500/80 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            You're all caught up!
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            No active tasks found. Relax or add a new task.
          </p>
          <Button
            onClick={() => setTaskModalOpen(true)}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80">
          {displayedTasks.map((task: Task) => {
            const isCompleted = task.status === 'completed';
            const project = projects.find((p) => p.id === task.projectId);
            const isExpanded = !!expandedTaskIds[task.id];
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const completedSubtasksCount =
              task.subtasks?.filter((s) => s.completed).length ?? 0;

            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={cn(
                  'group p-4 transition-all duration-150 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40',
                  isCompleted && 'bg-zinc-50/40 dark:bg-zinc-900/30'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Interactive Checkbox */}
                  <div className="pt-0.5">
                    <Checkbox
                      id={`task-checkbox-${task.id}`}
                      checked={isCompleted}
                      onChange={() => toggleTaskStatus(task.id)}
                    />
                  </div>

                  {/* Task Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setTaskModalOpen(true, task)}
                      >
                        <span
                          className={cn(
                            'text-sm font-medium transition-colors block hover:text-indigo-600 dark:hover:text-indigo-400',
                            isCompleted
                              ? 'line-through text-zinc-500 dark:text-zinc-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                          )}
                        >
                          {task.title}
                        </span>

                        {task.description && (
                          <p
                            className={cn(
                              'text-xs mt-1 leading-relaxed line-clamp-2',
                              isCompleted
                                ? 'text-zinc-500 dark:text-zinc-400 line-through'
                                : 'text-zinc-600 dark:text-zinc-400'
                            )}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Priority Tag & Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={getPriorityBadgeVariant(task.priority)}
                          size="sm"
                          className="uppercase text-[10px] tracking-wider"
                        >
                          {task.priority}
                        </Badge>

                        <button
                          onClick={() => setTaskModalOpen(true, task)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-opacity cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition-opacity cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta Row: Project, Due Date/Time, Tags, Subtask Toggle */}
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap text-xs">
                      {/* Project indicator */}
                      {project && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </span>
                      )}

                      {project && <span className="text-zinc-300 dark:text-zinc-700 font-light">•</span>}

                      {/* Due Date / Overdue / Today */}
                      {(() => {
                        const info = getTaskDueDateBadgeInfo(task);
                        const Icon = info.isOverdue ? AlertCircle : Clock;
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

                      {/* Tags */}
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[11px] bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}

                      {/* Subtask expander button */}
                      {hasSubtasks && (
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 ml-auto cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {completedSubtasksCount}/{task.subtasks?.length} subtasks
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Subtasks Collapsible List */}
                    {hasSubtasks && isExpanded && (
                      <div className="mt-3 pl-3 pt-2.5 border-l-2 border-indigo-100 dark:border-indigo-950/60 space-y-2">
                        {task.subtasks?.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300"
                          >
                            <Checkbox
                              id={`subtask-check-${subtask.id}`}
                              checked={subtask.completed}
                              onChange={() => toggleSubTask(task.id, subtask.id)}
                            />
                            <span
                              className={cn(
                                'transition-colors',
                                subtask.completed && 'line-through text-zinc-400 dark:text-zinc-500'
                              )}
                            >
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export const MyTasksList = TodayTasksList;
