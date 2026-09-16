import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { getGreeting } from '../../lib/utils';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { StatCards } from './StatCards';
import { TodayTasksList } from './TodayTasksList';
import { ProjectsOverview } from './ProjectsOverview';
import { StreakBanner } from './StreakBanner';
import { Button } from '../ui/Button';

export const OverviewDashboard: React.FC = () => {
  const { user, setTaskModalOpen } = useTaskFlowStore();
  const greeting = getGreeting();

  const formattedCurrentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {greeting}, {user?.name ? user.name.split(' ')[0] : 'Scholar'} 👋
            </h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Here's what's happening with your tasks today • <span className="font-medium text-zinc-700 dark:text-zinc-300">{formattedCurrentDate}</span>
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <Button
            id="dashboard-new-task-btn"
            onClick={() => setTaskModalOpen(true)}
            size="md"
            className="shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Streak Highlight */}
      <StreakBanner />

      {/* Live Computed Statistics */}
      <StatCards />

      {/* Main Today's Tasks Section */}
      <TodayTasksList />

      {/* Projects Velocity Overview */}
      <ProjectsOverview />
    </div>
  );
};
