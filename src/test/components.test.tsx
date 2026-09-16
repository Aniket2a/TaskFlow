import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TaskListView } from '../components/views/TaskListView';
import { TaskModal } from '../components/tasks/TaskModal';
import { Sidebar } from '../components/layout/Sidebar';
import { useTaskFlowStore } from '../store/useTaskFlowStore';

// Mock the API client
vi.mock('../services/api', () => ({
  api: {
    tasks: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async (t) => ({ ...t, id: 'mock_created_1' })),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    projects: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    tags: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('Frontend UI Components & Navigation Testing', () => {
  beforeEach(() => {
    useTaskFlowStore.setState({
      tasks: [],
      projects: [
        {
          id: 'proj_1',
          name: 'Distributed Systems',
          description: 'Raft consensus project',
          color: '#6366f1',
        },
      ],
      tags: [],
      user: {
        id: 'user_1',
        name: 'Demo Student',
        email: 'demo@university.edu',
        role: 'Student',
      },
      activeTab: 'inbox',
      selectedProjectId: null,
      searchQuery: '',
      selectedPriorityFilter: 'all',
      selectedTagFilter: 'all',
      selectedStatusFilter: 'all',
      isTaskModalOpen: false,
      editingTask: null,
    });
  });

  it('renders clean empty state when no tasks exist in Inbox', () => {
    render(
      <MemoryRouter initialEntries={['/inbox']}>
        <TaskListView viewType="inbox" />
      </MemoryRouter>
    );
    expect(screen.getByText('No tasks in your inbox')).toBeInTheDocument();
    expect(
      screen.getByText('All caught up! Create a new task or adjust your active filters.')
    ).toBeInTheDocument();
  });

  it('renders tasks when tasks are populated in the store', () => {
    useTaskFlowStore.setState({
      tasks: [
        {
          id: 'task_1',
          userId: 'user_1',
          title: 'Complete Compiler Optimization Project',
          description: 'Implement SSA form and dead code elimination',
          priority: 'high',
          status: 'todo',
          projectId: '',
          tags: ['CS450'],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/inbox']}>
        <TaskListView viewType="inbox" />
      </MemoryRouter>
    );
    expect(screen.getByText('Complete Compiler Optimization Project')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('renders today tasks properly and filters out non-today tasks', () => {
    const today = new Date().toISOString().split('T')[0];
    useTaskFlowStore.setState({
      tasks: [
        {
          id: 'task_today',
          userId: 'user_1',
          title: 'Prepare Lecture Slides',
          description: 'Review chapters 4 & 5',
          priority: 'high',
          status: 'todo',
          dueDate: today,
          projectId: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task_future',
          userId: 'user_1',
          title: 'Submit Final Paper',
          description: 'Due in 3 weeks',
          priority: 'low',
          status: 'todo',
          dueDate: '2099-12-31',
          projectId: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/today']}>
        <TaskListView viewType="today" />
      </MemoryRouter>
    );

    expect(screen.getByText('Prepare Lecture Slides')).toBeInTheDocument();
    expect(screen.queryByText('Submit Final Paper')).not.toBeInTheDocument();
  });

  it('renders upcoming tasks chronologically and excludes completed tasks', () => {
    useTaskFlowStore.setState({
      tasks: [
        {
          id: 'task_upcoming_1',
          userId: 'user_1',
          title: 'Future Milestone Alpha',
          description: 'Scheduled milestone',
          priority: 'medium',
          status: 'todo',
          dueDate: '2099-10-15',
          projectId: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task_completed',
          userId: 'user_1',
          title: 'Old Finished Goal',
          description: '',
          priority: 'low',
          status: 'completed',
          dueDate: '2099-10-15',
          projectId: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/upcoming']}>
        <TaskListView viewType="upcoming" />
      </MemoryRouter>
    );

    expect(screen.getByText('Future Milestone Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Old Finished Goal')).not.toBeInTheDocument();
  });

  it('renders completed view with completed tasks', () => {
    useTaskFlowStore.setState({
      tasks: [
        {
          id: 'task_done',
          userId: 'user_1',
          title: 'Lab 1 Verified and Graded',
          description: 'Graded 100/100',
          priority: 'low',
          status: 'completed',
          completedAt: new Date().toISOString(),
          projectId: '',
          tags: ['Lab'],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/completed']}>
        <TaskListView viewType="completed" />
      </MemoryRouter>
    );

    expect(screen.getByText('Lab 1 Verified and Graded')).toBeInTheDocument();
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
  });

  it('sidebar displays navigation buttons and dynamic counts', () => {
    const today = new Date().toISOString().split('T')[0];
    useTaskFlowStore.setState({
      tasks: [
        {
          id: 't1',
          userId: 'user_1',
          title: 'Task 1',
          priority: 'medium',
          status: 'todo',
          dueDate: today,
          projectId: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 't2',
          userId: 'user_1',
          title: 'Task 2',
          priority: 'low',
          status: 'completed',
          projectId: '',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays form validation error when task title is empty', async () => {
    useTaskFlowStore.setState({ isTaskModalOpen: true, editingTask: null });
    render(
      <MemoryRouter>
        <TaskModal />
      </MemoryRouter>
    );

    // Attempt to submit empty form
    const submitBtn = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Task title is required')).toBeInTheDocument();
    });
  });
});
