import React, { useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  CalendarDays,
  ListTodo,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Project, Task } from '../../types';
import { Badge } from '../ui/Badge';
import {
  parseDueDateToLocalDate,
  getTodayDateLocal,
  getTaskDueDateBadgeInfo,
  sortActiveTasks,
} from '../../lib/taskFilters';
import { formatDate, cn } from '../../lib/utils';

interface WorkspaceDetailsModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

export const WorkspaceDetailsModal: React.FC<WorkspaceDetailsModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const { tasks, projects } = useTaskFlowStore();
  const currentProject = project ? projects.find((p) => p.id === project.id) || project : null;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Tasks belonging to ONLY this workspace
  const workspaceTasks = useMemo(() => {
    if (!currentProject) return [];
    return tasks.filter((t) => t.projectId === currentProject.id);
  }, [tasks, currentProject]);

  // Derived progress and statistics
  const stats = useMemo(() => {
    const total = workspaceTasks.length;
    const completed = workspaceTasks.filter((t) => t.status === 'completed').length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const today = getTodayDateLocal();
    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;

    let highPriority = 0;
    let mediumPriority = 0;
    let lowPriority = 0;

    for (const task of workspaceTasks) {
      // Priority breakdown
      if (task.priority === 'high') highPriority++;
      else if (task.priority === 'medium') mediumPriority++;
      else if (task.priority === 'low') lowPriority++;

      // Due date summary for active/non-completed tasks
      if (task.status !== 'completed') {
        const taskDate = parseDueDateToLocalDate(task.dueDate);
        if (taskDate) {
          const taskTime = taskDate.getTime();
          const todayTime = today.getTime();
          if (taskTime < todayTime) {
            overdue++;
          } else if (taskTime === todayTime) {
            dueToday++;
          } else if (taskTime > todayTime) {
            upcoming++;
          }
        }
      }
    }

    return {
      total,
      completed,
      remaining,
      percentage,
      overdue,
      dueToday,
      upcoming,
      highPriority,
      mediumPriority,
      lowPriority,
    };
  }, [workspaceTasks]);

  // Up to 5 most recently active/updated tasks from this workspace using sortActiveTasks
  const recentTasks = useMemo(() => {
    const active = workspaceTasks.filter((t) => t.status !== 'completed');
    const completed = workspaceTasks.filter((t) => t.status === 'completed');
    const sortedActive = sortActiveTasks(active);
    return [...sortedActive, ...completed].slice(0, 5);
  }, [workspaceTasks]);

  if (!isOpen || !currentProject) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="workspace-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-details-title"
        aria-describedby="workspace-details-desc"
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Workspace Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="w-4 h-4 rounded-full shrink-0 mt-1 ring-2 ring-white dark:ring-zinc-900 shadow-xs"
              style={{ backgroundColor: currentProject.color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2
                id="workspace-details-title"
                className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate"
              >
                {currentProject.name}
              </h2>
              {currentProject.description ? (
                <p
                  id="workspace-details-desc"
                  className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2"
                >
                  {currentProject.description}
                </p>
              ) : (
                <p
                  id="workspace-details-desc"
                  className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-0.5"
                >
                  No description provided
                </p>
              )}
            </div>
          </div>

          <button
            id="close-workspace-details-btn"
            type="button"
            onClick={onClose}
            aria-label="Close workspace details"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 2. Progress Section */}
          <div className="bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Workspace Progress
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {stats.percentage}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div
              className="w-full h-2.5 bg-zinc-200/80 dark:bg-zinc-700/60 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={stats.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Completion progress"
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${stats.percentage}%`,
                  backgroundColor: currentProject.color || '#4f46e5',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-2.5">
              <span>
                Completed: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{stats.completed}</strong> / {stats.total}
              </span>
              <span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{stats.remaining}</strong> remaining
              </span>
            </div>

            {stats.total === 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 italic">
                No tasks in this workspace yet.
              </p>
            )}
          </div>

          {/* 3. Statistics */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
              Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {/* Total tasks */}
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Total tasks</span>
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                  {stats.total}
                </div>
              </div>

              {/* Completed */}
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {stats.completed}
                </div>
              </div>

              {/* Remaining */}
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Remaining</span>
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                  {stats.remaining}
                </div>
              </div>

              {/* Overdue */}
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Overdue</span>
                </div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                  {stats.overdue}
                </div>
              </div>

              {/* Due today */}
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due today</span>
                </div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  {stats.dueToday}
                </div>
              </div>

              {/* Upcoming */}
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Upcoming</span>
                </div>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                  {stats.upcoming}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Priority Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
              Priority Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <div className="p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                  High
                </span>
                <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5 tabular-nums">
                  {stats.highPriority}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Medium
                </span>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">
                  {stats.mediumPriority}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Low
                </span>
                <div className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                  {stats.lowPriority}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Recent Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Recent Tasks
              </h3>
              {recentTasks.length > 0 && (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Showing {recentTasks.length} of {stats.total}
                </span>
              )}
            </div>

            {recentTasks.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 bg-zinc-50/40 dark:bg-zinc-900/40">
                <ListTodo className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  No tasks in this workspace yet.
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Tasks created for this workspace will appear here.
                </p>
              </div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                {recentTasks.map((task: Task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium truncate ${
                            isCompleted
                              ? 'text-zinc-400 dark:text-zinc-500 line-through'
                              : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status badge */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                              : task.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {task.status === 'in_progress'
                            ? 'In Progress'
                            : task.status === 'completed'
                            ? 'Completed'
                            : 'To Do'}
                        </span>

                        {/* Priority */}
                        <Badge
                          variant={
                            task.priority === 'high'
                              ? 'high'
                              : task.priority === 'medium'
                              ? 'medium'
                              : 'low'
                          }
                          size="sm"
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>

                        {/* Due Date */}
                        <span className="text-[11px] flex items-center gap-1 min-w-[75px] justify-end">
                          {(() => {
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
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

