import { z } from 'zod';

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Title must be 255 characters or fewer'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional()
    .default(''),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'completed'] as const).default('todo'),
  projectId: z.string().optional().default(''),
  dueDate: z.string().optional().default(''),
  dueTime: z.string().optional().default(''),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly'] as const).default('none'),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

export const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(128, 'Project name must be 128 characters or fewer'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or fewer')
    .optional()
    .default(''),
  color: z
    .string()
    .min(1, 'Please select a color code')
    .max(32, 'Color code is invalid'),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

export const authFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  displayName: z
    .string()
    .max(100, 'Display name cannot exceed 100 characters')
    .optional(),
});

export type AuthFormData = z.infer<typeof authFormSchema>;
