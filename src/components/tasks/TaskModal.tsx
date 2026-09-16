import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Calendar,
  Clock,
  Tag as TagIcon,
  ListTodo,
  Flag,
  Folder,
  Plus,
  Trash2,
  CheckCircle2,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { TaskPriority, RecurrenceType, SubTask, Task } from '../../types';
import { Button } from '../ui/Button';
import { taskFormSchema, TaskFormData } from '../../lib/validations';
import { getLocalDateString } from '../../lib/taskFilters';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    setTaskModalOpen,
    editingTask,
    createTask,
    updateTask,
    deleteTask,
    projects,
    selectedProjectId,
  } = useTaskFlowStore();

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      projectId: '',
      dueDate: '',
      dueTime: '',
      recurrence: 'none',
    },
  });

  const currentPriority = watch('priority');
  const currentRecurrence = watch('recurrence');
  const currentDueDate = watch('dueDate');

  // Populate form fields when modal opens or editingTask changes
  useEffect(() => {
    if (!isTaskModalOpen) return;

    if (editingTask) {
      reset({
        title: editingTask.title,
        description: editingTask.description || '',
        priority: editingTask.priority,
        status: editingTask.status,
        projectId: editingTask.projectId || '',
        dueDate:
          editingTask.dueDate === 'Today'
            ? getLocalDateString()
            : editingTask.dueDate || '',
        dueTime: editingTask.dueTime || '',
        recurrence: editingTask.recurrence || 'none',
      });
      setTags(editingTask.tags || []);
      setSubtasks(editingTask.subtasks || []);
    } else {
      const today = getLocalDateString();
      reset({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        projectId: selectedProjectId || projects[0]?.id || '',
        dueDate: today,
        dueTime: '',
        recurrence: 'none',
      });
      setTags([]);
      setSubtasks([]);
    }
    setServerError(null);
    setTagInput('');
    setNewSubtaskTitle('');
  }, [editingTask, isTaskModalOpen, selectedProjectId, projects, reset]);

  if (!isTaskModalOpen) return null;

  const handleAddTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: newSubtaskTitle.trim(),
          completed: false,
        },
      ]);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSetQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setValue('dueDate', getLocalDateString(d));
  };

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: data.title.trim(),
          description: data.description ? data.description.trim() : '',
          priority: data.priority,
          status: data.status,
          projectId: data.projectId ? data.projectId.trim() : '',
          dueDate: data.dueDate ? data.dueDate.trim() : '',
          dueTime: data.dueTime ? data.dueTime.trim() : '',
          recurrence: data.recurrence || 'none',
          tags,
          subtasks,
        });
      } else {
        await createTask({
          title: data.title.trim(),
          description: data.description ? data.description.trim() : '',
          priority: data.priority,
          projectId: data.projectId ? data.projectId.trim() : '',
          status: 'todo',
          dueDate: data.dueDate ? data.dueDate.trim() : '',
          dueTime: data.dueTime ? data.dueTime.trim() : '',
          recurrence: data.recurrence || 'none',
          tags,
          subtasks,
        });
      }
      setTaskModalOpen(false);
    } catch (err: any) {
      console.error('Task save error:', err);
      setServerError(err.message || 'Could not save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTask) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(editingTask.id);
      setTaskModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="task-modal"
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Plan, categorize, and schedule your work
              </p>
            </div>
          </div>
          <button
            id="close-task-modal-btn"
            onClick={() => setTaskModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {serverError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Title input with Zod error validation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              {...register('title')}
              placeholder="e.g. Finish Distributed Systems lab report"
              className={`w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border ${
                errors.title
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-zinc-200 dark:border-zinc-700 focus:border-indigo-600'
              } rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden transition-all`}
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description & Notes
            </label>
            <textarea
              id="task-desc-input"
              {...register('description')}
              rows={3}
              placeholder="Add extra context, links, or criteria..."
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-indigo-600 transition-all resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Grid: Project & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Project Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                Workspace / Project
              </label>
              <select
                id="task-project-select"
                {...register('projectId')}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-600"
              >
                <option value="">No Project (Inbox)</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-zinc-400" />
                Priority Tier
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                  const isSelected = currentPriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue('priority', p)}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                        isSelected
                          ? p === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-400'
                            : p === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Due Date
              </label>
              <input
                id="task-due-date-input"
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-600"
              />
              {/* Quick Date Presets */}
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(7)}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Next Week
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Due Time (Optional)
              </label>
              <input
                id="task-due-time-input"
                type="time"
                {...register('dueTime')}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Recurrence Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-zinc-400" />
              Recurrence
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue('recurrence', r)}
                  className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors cursor-pointer ${
                    currentRecurrence === r
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
              </span>
            </label>

            <div className="space-y-1.5 mb-2">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg group"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => handleToggleSubtask(st.id)}
                    className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-xs ${
                      st.completed
                        ? 'line-through text-zinc-400'
                        : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-1 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a step to this task..."
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-indigo-600"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-zinc-400" />
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press Enter..."
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-indigo-600"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add Tag
              </Button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            {editingTask ? (
              <Button
                id="delete-task-btn"
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTaskModalOpen(false)}
              >
                Cancel
              </Button>
              <Button id="save-task-btn" type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
