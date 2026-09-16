import { describe, it, expect } from 'vitest';
import {
  getMyTasks,
  getTodayTasks,
  getUpcomingTasks,
  getCompletedTasks,
  calculateCurrentStreak,
  getLocalDateString,
  filterTasksWithSecondaryFilters,
} from '../lib/taskFilters';
import { Task, Project } from '../types';

describe('TaskFlow Filtering & Streak Calculations', () => {
  const todayStr = getLocalDateString(new Date());

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = getLocalDateString(dayAfterTomorrow);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const sampleTasks: Task[] = [
    {
      id: 't-no-date',
      userId: 'user-1',
      title: 'Task with no due date',
      status: 'todo',
      priority: 'low',
      projectId: '',
      tags: [],
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-10T10:00:00.000Z',
    },
    {
      id: 't-today',
      userId: 'user-1',
      title: 'Task due today',
      status: 'todo',
      priority: 'high',
      projectId: '',
      tags: [],
      dueDate: todayStr,
      createdAt: '2026-09-11T10:00:00.000Z',
      updatedAt: '2026-09-11T10:00:00.000Z',
    },
    {
      id: 't-tomorrow',
      userId: 'user-1',
      title: 'Task due tomorrow',
      status: 'in_progress',
      priority: 'medium',
      projectId: '',
      tags: [],
      dueDate: tomorrowStr,
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
    },
    {
      id: 't-day-after',
      userId: 'user-1',
      title: 'Task due day after tomorrow',
      status: 'todo',
      priority: 'low',
      projectId: '',
      tags: [],
      dueDate: dayAfterTomorrowStr,
      createdAt: '2026-09-13T10:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
    },
    {
      id: 't-completed-today',
      userId: 'user-1',
      title: 'Completed task today',
      status: 'completed',
      priority: 'medium',
      projectId: '',
      tags: [],
      dueDate: todayStr,
      completedAt: new Date().toISOString(),
      createdAt: '2026-09-14T08:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
    },
    {
      id: 't-completed-yesterday',
      userId: 'user-1',
      title: 'Completed task yesterday',
      status: 'completed',
      priority: 'high',
      projectId: '',
      tags: [],
      dueDate: yesterdayStr,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: '2026-09-13T08:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
    },
  ];

  describe('1. Overview / My Tasks Filtering', () => {
    it('shows ALL active/non-completed tasks (no due date, due today, due in future) and excludes completed', () => {
      const myTasks = getMyTasks(sampleTasks);

      // Must exclude completed tasks
      expect(myTasks.every((t) => t.status !== 'completed')).toBe(true);

      const ids = myTasks.map((t) => t.id);
      expect(ids).toContain('t-no-date');
      expect(ids).toContain('t-today');
      expect(ids).toContain('t-tomorrow');
      expect(ids).toContain('t-day-after');
      expect(ids).not.toContain('t-completed-today');
      expect(ids).not.toContain('t-completed-yesterday');
      expect(myTasks.length).toBe(4);
    });
  });

  describe('2. Today Page Filtering', () => {
    it('shows only active tasks whose due date is today', () => {
      const todayTasks = getTodayTasks(sampleTasks);

      expect(todayTasks.length).toBe(1);
      expect(todayTasks[0].id).toBe('t-today');
      expect(todayTasks[0].status).not.toBe('completed');
    });

    it('excludes future tasks and tasks without due date', () => {
      const todayTasks = getTodayTasks(sampleTasks);
      const ids = todayTasks.map((t) => t.id);

      expect(ids).not.toContain('t-tomorrow');
      expect(ids).not.toContain('t-day-after');
      expect(ids).not.toContain('t-no-date');
      expect(ids).not.toContain('t-completed-today');
    });
  });

  describe('3. Upcoming Page Filtering', () => {
    it('shows active tasks with a future due date, sorted nearest first', () => {
      const upcomingTasks = getUpcomingTasks(sampleTasks);

      expect(upcomingTasks.length).toBe(2);
      expect(upcomingTasks[0].id).toBe('t-tomorrow');
      expect(upcomingTasks[1].id).toBe('t-day-after');
    });

    it('excludes tasks with no due date, tasks due today, and completed tasks', () => {
      const upcomingTasks = getUpcomingTasks(sampleTasks);
      const ids = upcomingTasks.map((t) => t.id);

      expect(ids).not.toContain('t-no-date');
      expect(ids).not.toContain('t-today');
      expect(ids).not.toContain('t-completed-today');
      expect(ids).not.toContain('t-completed-yesterday');
    });
  });

  describe('4. Completed Page Filtering', () => {
    it('shows only completed tasks and sorts newest recently completed first', () => {
      const completedTasks = getCompletedTasks(sampleTasks);

      expect(completedTasks.length).toBe(2);
      expect(completedTasks.every((t) => t.status === 'completed')).toBe(true);
      expect(completedTasks[0].id).toBe('t-completed-today');
      expect(completedTasks[1].id).toBe('t-completed-yesterday');
    });

    it('does not mix active tasks into completed view', () => {
      const completedTasks = getCompletedTasks(sampleTasks);
      const ids = completedTasks.map((t) => t.id);

      expect(ids).not.toContain('t-no-date');
      expect(ids).not.toContain('t-today');
      expect(ids).not.toContain('t-tomorrow');
    });
  });

  describe('6. Streak Calculation', () => {
    const baseDate = new Date(2026, 8, 15, 12, 0, 0); // 2026-09-15 12:00 local time

    it('returns streak 3 when completed today + yesterday + day before yesterday', () => {
      const tasks: Task[] = [
        {
          id: 'c1',
          userId: 'u1',
          title: 'Day 1 task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 15, 10, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'c2',
          userId: 'u1',
          title: 'Day 2 task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 14, 15, 30, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'c3',
          userId: 'u1',
          title: 'Day 3 task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 13, 9, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
      ];

      expect(calculateCurrentStreak(tasks, baseDate)).toBe(3);
    });

    it('returns streak 1 when completed today only', () => {
      const tasks: Task[] = [
        {
          id: 'c1',
          userId: 'u1',
          title: 'Today task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 15, 14, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
      ];

      expect(calculateCurrentStreak(tasks, baseDate)).toBe(1);
    });

    it('returns streak 0 when completed yesterday but nothing today', () => {
      const tasks: Task[] = [
        {
          id: 'c1',
          userId: 'u1',
          title: 'Yesterday task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 14, 16, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
      ];

      expect(calculateCurrentStreak(tasks, baseDate)).toBe(0);
    });

    it('counts two completed tasks on the same day as ONE day', () => {
      const tasks: Task[] = [
        {
          id: 'c1',
          userId: 'u1',
          title: 'Today morning task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 15, 9, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'c2',
          userId: 'u1',
          title: 'Today afternoon task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 15, 17, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
      ];

      expect(calculateCurrentStreak(tasks, baseDate)).toBe(1);
    });

    it('breaks the streak when a calendar day is missed', () => {
      const tasks: Task[] = [
        {
          id: 'c1',
          userId: 'u1',
          title: 'Today task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 15, 10, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
        // Missing yesterday (2026-09-14)
        {
          id: 'c2',
          userId: 'u1',
          title: 'Two days ago task',
          status: 'completed',
          priority: 'medium',
          projectId: '',
          tags: [],
          completedAt: new Date(2026, 8, 13, 10, 0, 0).toISOString(),
          createdAt: '',
          updatedAt: '',
        },
      ];

      expect(calculateCurrentStreak(tasks, baseDate)).toBe(1);
    });
  });

  describe('Global Search & Secondary Filters Integration', () => {
    const testProjects: Project[] = [
      { id: 'p-1', name: 'Engineering', color: 'blue' },
    ];

    const testTasks: Task[] = [
      {
        id: 'task-1',
        userId: 'user-1',
        title: 'Fix Login Bug',
        description: 'Authentication token expires too soon on mobile',
        status: 'todo',
        priority: 'high',
        projectId: 'p-1',
        tags: ['bug', 'auth'],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'task-2',
        userId: 'user-1',
        title: 'Design Landing Page',
        description: 'Create hero section mockups',
        status: 'in_progress',
        priority: 'medium',
        projectId: '',
        tags: ['design'],
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('searches case-insensitively and whitespace-tolerantly by title, description, workspace, and tag', () => {
      // By project name "Engineering"
      const resProj = filterTasksWithSecondaryFilters(testTasks, { searchQuery: '  ENGINEERING  ' }, testProjects);
      expect(resProj.length).toBe(1);
      expect(resProj[0].id).toBe('task-1');

      // By description keyword "token"
      const resDesc = filterTasksWithSecondaryFilters(testTasks, { searchQuery: 'TOKEN' }, testProjects);
      expect(resDesc.length).toBe(1);
      expect(resDesc[0].id).toBe('task-1');

      // By tag "bug"
      const resTag = filterTasksWithSecondaryFilters(testTasks, { searchQuery: 'bug' }, testProjects);
      expect(resTag.length).toBe(1);
      expect(resTag[0].id).toBe('task-1');
    });

    it('combines multiple filters using AND logic', () => {
      // High priority AND tag "bug"
      const resAND = filterTasksWithSecondaryFilters(
        testTasks,
        { priorityFilter: 'high', tagFilter: 'bug' },
        testProjects
      );
      expect(resAND.length).toBe(1);
      expect(resAND[0].id).toBe('task-1');

      // High priority AND tag "design" -> should yield 0 results
      const resZero = filterTasksWithSecondaryFilters(
        testTasks,
        { priorityFilter: 'high', tagFilter: 'design' },
        testProjects
      );
      expect(resZero.length).toBe(0);
    });
  });
});
