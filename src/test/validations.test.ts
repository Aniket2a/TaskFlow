import { describe, it, expect } from 'vitest';
import { taskFormSchema, projectFormSchema, authFormSchema } from '../lib/validations';

describe('Form Validations (Zod Schemas)', () => {
  describe('taskFormSchema', () => {
    it('rejects task with empty title', () => {
      const result = taskFormSchema.safeParse({
        title: '',
        priority: 'medium',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Task title is required');
      }
    });

    it('rejects task with title longer than 255 characters', () => {
      const longTitle = 'a'.repeat(256);
      const result = taskFormSchema.safeParse({
        title: longTitle,
        priority: 'medium',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('255 characters');
      }
    });

    it('rejects invalid priority', () => {
      const result = taskFormSchema.safeParse({
        title: 'Valid Task Title',
        priority: 'urgent_invalid',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid task payload with defaults', () => {
      const result = taskFormSchema.safeParse({
        title: 'Finish Distributed Systems Assignment',
        priority: 'high',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Finish Distributed Systems Assignment');
        expect(result.data.status).toBe('todo');
        expect(result.data.priority).toBe('high');
        expect(result.data.recurrence).toBe('none');
      }
    });
  });

  describe('projectFormSchema', () => {
    it('rejects project with empty name', () => {
      const result = projectFormSchema.safeParse({
        name: '',
        color: '#6366f1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Project name is required');
      }
    });

    it('accepts valid project payload', () => {
      const result = projectFormSchema.safeParse({
        name: 'CS Capstone',
        description: 'Semester long group engineering project',
        color: '#10b981',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('authFormSchema', () => {
    it('rejects invalid email address', () => {
      const result = authFormSchema.safeParse({
        email: 'invalid-email-string',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email address');
      }
    });

    it('rejects password shorter than 6 characters', () => {
      const result = authFormSchema.safeParse({
        email: 'student@university.edu',
        password: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 6 characters');
      }
    });

    it('accepts valid auth payload', () => {
      const result = authFormSchema.safeParse({
        email: 'scholar@mit.edu',
        password: 'securePassword99',
        displayName: 'Jane Doe',
      });
      expect(result.success).toBe(true);
    });
  });
});
