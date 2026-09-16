import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FolderPlus, Palette, Check, AlertCircle } from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Button } from '../ui/Button';
import { projectFormSchema, ProjectFormData } from '../../lib/validations';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject, updateProject, editingProject, setProjectModalOpen } =
    useTaskFlowStore();
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      color: COLOR_OPTIONS[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        reset({
          name: editingProject.name,
          description: editingProject.description || '',
          color: editingProject.color,
        });
        setSelectedColor(editingProject.color);
      } else {
        reset({
          name: '',
          description: '',
          color: COLOR_OPTIONS[0],
        });
        setSelectedColor(COLOR_OPTIONS[0]);
      }
      setServerError(null);
    }
  }, [isOpen, editingProject, reset]);

  if (!isOpen) return null;

  const handleColorPick = (color: string) => {
    setSelectedColor(color);
    setValue('color', color, { shouldValidate: true });
  };

  const onSubmit = async (data: ProjectFormData) => {
    setServerError(null);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          color: data.color,
        });
      } else {
        await createProject({
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          color: data.color,
        });
      }
      onClose();
      if (setProjectModalOpen) {
        setProjectModalOpen(false, null);
      }
    } catch (err: any) {
      console.error('Project save error:', err);
      setServerError(err.message || 'Could not save workspace project.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="project-modal"
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {editingProject ? 'Edit Workspace' : 'New Project Workspace'}
            </h3>
          </div>
          <button
            id="close-project-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              {...register('name')}
              autoFocus
              placeholder="e.g. Distributed Systems (CS401)"
              className={`w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border ${
                errors.name
                  ? 'border-rose-500'
                  : 'border-zinc-200 dark:border-zinc-700 focus:border-indigo-600'
              } rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden transition-all`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description / Objective
            </label>
            <input
              id="project-desc-input"
              type="text"
              {...register('description')}
              placeholder="e.g. Labs, homework and midterms"
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-600 transition-all"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              Theme Color
            </label>
            <input type="hidden" {...register('color')} />
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorPick(c)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={`Select ${c}`}
                >
                  {selectedColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
            {errors.color && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errors.color.message}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button id="save-project-btn" type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : editingProject
                ? 'Save Changes'
                : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
