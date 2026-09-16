/**
 * Isolated Seed Demo Utility.
 *
 * Provides realistic student sample tasks and projects on-demand (e.g. via Settings button)
 * without ever automatically polluting authenticated user data or merging automatically.
 */

import { api } from './api';
import { Project, Task } from '../types';

export const SAMPLE_PROJECTS: Omit<Project, 'id'>[] = [
  {
    name: 'CS Capstone',
    color: '#6366f1',
    description: 'Final year software engineering project and design documentation',
  },
  {
    name: 'Distributed Systems',
    color: '#10b981',
    description: 'Raft consensus, RPC protocols, and fault-tolerant computing coursework',
  },
  {
    name: 'Personal & Career',
    color: '#f59e0b',
    description: 'Resume review, tech interview prep, and student developer pack',
  },
];

export const SAMPLE_TASKS: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Write technical architecture spec for TaskFlow',
    description: 'Document FastAPI endpoints, Firebase security rules, and user data isolation model.',
    status: 'todo',
    priority: 'high',
    projectId: '',
    tags: ['Documentation', 'CS301'],
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    recurrence: 'none',
    subtasks: [
      { id: 'sub_1', title: 'Define Pydantic request models', completed: true },
      { id: 'sub_2', title: 'Write Firestore security rules', completed: true },
      { id: 'sub_3', title: 'Add Pytest coverage', completed: false },
    ],
  },
  {
    title: 'Review Chapter 5: Distributed Consensus (Raft)',
    description: 'Study leader election timeouts, log replication RPCs, and state machine transitions.',
    status: 'in_progress',
    priority: 'medium',
    projectId: '',
    tags: ['Study'],
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '20:00',
    recurrence: 'none',
    subtasks: [],
  },
  {
    title: 'Submit Lab 3: Concurrent Web Crawler',
    description: 'Verify goroutines and channel synchronization before submitting to Git grading server.',
    status: 'completed',
    priority: 'high',
    projectId: '',
    tags: ['Lab', 'CS301'],
    dueDate: new Date().toISOString().split('T')[0],
    completedAt: new Date().toISOString(),
    recurrence: 'none',
    subtasks: [],
  },
  {
    title: 'Renew GitHub Student Developer Pack',
    description: 'Upload current academic enrollment verification document.',
    status: 'completed',
    priority: 'low',
    projectId: '',
    tags: ['Career'],
    completedAt: new Date().toISOString(),
    recurrence: 'none',
    subtasks: [],
  },
];

export async function seedSampleDataForUser(): Promise<{ createdTasks: number; createdProjects: number }> {
  let createdProjects = 0;
  let createdTasks = 0;

  const projectMap: Record<string, string> = {};

  for (const proj of SAMPLE_PROJECTS) {
    try {
      const created = await api.projects.create(proj);
      projectMap[proj.name] = created.id;
      createdProjects++;
    } catch (e) {
      console.warn('Failed to seed project:', proj.name, e);
    }
  }

  for (const task of SAMPLE_TASKS) {
    try {
      let assignedProjectId = '';
      if (task.title.includes('Capstone') || task.title.includes('TaskFlow')) {
        assignedProjectId = projectMap['CS Capstone'] || '';
      } else if (task.title.includes('Distributed') || task.title.includes('Crawler')) {
        assignedProjectId = projectMap['Distributed Systems'] || '';
      } else {
        assignedProjectId = projectMap['Personal & Career'] || '';
      }

      await api.tasks.create({
        ...task,
        projectId: assignedProjectId,
      });
      createdTasks++;
    } catch (e) {
      console.warn('Failed to seed task:', task.title, e);
    }
  }

  return { createdTasks, createdProjects };
}
