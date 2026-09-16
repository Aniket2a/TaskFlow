import { describe, it, expect } from 'vitest';
import { cleanTaskForFirestore, cleanProjectForFirestore } from '../lib/firebase';
import { Task } from '../types';

describe('Firestore Sanitization & undefined-value prevention', () => {
  const uid = 'user_12345';

  it('handles task creation with NO project (empty or undefined)', () => {
    const rawTask: Partial<Task> & { id: string } = {
      id: 'task_no_project',
      title: 'Solo task',
      projectId: undefined,
    };

    const doc = cleanTaskForFirestore(rawTask, uid);

    expect(doc.id).toBe('task_no_project');
    expect(doc.userId).toBe(uid);
    expect(doc.projectId).toBe(''); // empty string, never undefined
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });

  it('handles task creation with NO due time', () => {
    const rawTask: Partial<Task> & { id: string } = {
      id: 'task_no_due_time',
      title: 'Due today sometime',
      dueDate: '2026-09-15',
      dueTime: undefined,
    };

    const doc = cleanTaskForFirestore(rawTask, uid);

    expect(doc.dueDate).toBe('2026-09-15');
    expect('dueTime' in doc).toBe(false); // omitted entirely
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });

  it('handles task creation with NO tags', () => {
    const rawTask: Partial<Task> & { id: string } = {
      id: 'task_no_tags',
      title: 'No tags task',
      tags: undefined,
    };

    const doc = cleanTaskForFirestore(rawTask, uid);

    expect(Array.isArray(doc.tags)).toBe(true);
    expect(doc.tags).toEqual([]); // empty array, never undefined
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });

  it('handles task creation WITH a due date and valid data types', () => {
    const rawTask: Partial<Task> & { id: string } = {
      id: 'task_with_due_date',
      title: 'Submit Paper',
      description: 'Finish literature review',
      dueDate: '2026-09-20',
      dueTime: '17:00',
      priority: 'high',
      tags: ['research', 'thesis'],
      subtasks: [
        { id: 'sub_1', title: 'Draft outline', completed: true },
        { id: 'sub_2', title: 'Write intro', completed: false },
      ],
    };

    const doc = cleanTaskForFirestore(rawTask, uid);

    expect(doc.dueDate).toBe('2026-09-20');
    expect(doc.dueTime).toBe('17:00');
    expect(doc.tags).toEqual(['research', 'thesis']);
    expect(doc.subtasks[0].completed).toBe(true); // boolean preserved
    expect(doc.subtasks[1].completed).toBe(false); // boolean preserved
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });

  it('handles editing a task and clearing optional fields without undefined', () => {
    const rawEditedTask: Partial<Task> & { id: string } = {
      id: 'task_edit',
      title: 'Updated Title',
      description: '',
      projectId: '',
      dueDate: undefined,
      dueTime: undefined,
      completedAt: undefined,
      status: 'todo',
    };

    const doc = cleanTaskForFirestore(rawEditedTask, uid);

    expect(doc.title).toBe('Updated Title');
    expect(doc.description).toBe('');
    expect(doc.projectId).toBe('');
    expect('dueDate' in doc).toBe(false);
    expect('dueTime' in doc).toBe(false);
    expect('completedAt' in doc).toBe(false);
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });

  it('handles completing a task with completedAt timestamp', () => {
    const rawCompletedTask: Partial<Task> & { id: string } = {
      id: 'task_completed',
      title: 'Done task',
      status: 'completed',
    };

    const doc = cleanTaskForFirestore(rawCompletedTask, uid);

    expect(doc.status).toBe('completed');
    expect(typeof doc.completedAt).toBe('string');
    expect(doc.completedAt.length).toBeGreaterThan(0);
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });

  it('guarantees cleanProjectForFirestore has no undefined fields', () => {
    const project = {
      id: 'proj_1',
      name: 'Design System',
      color: '#6366f1',
    };

    const doc = cleanProjectForFirestore(project);

    expect(doc.id).toBe('proj_1');
    expect(doc.name).toBe('Design System');
    expect(doc.description).toBe('');
    expect('icon' in doc).toBe(false);
    expect(Object.values(doc).some((v) => v === undefined)).toBe(false);
  });
});
