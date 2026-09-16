import React from 'react';
import { CheckCircle2, CircleDashed, Clock, Sparkles } from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Card } from '../ui/Card';

export const StatCards: React.FC = () => {
  const getDashboardStats = useTaskFlowStore((state) => state.getDashboardStats);
  const stats = getDashboardStats();

  const statItems = [
    {
      id: 'stat-total',
      label: 'Total Tasks',
      value: stats.totalTasks,
      icon: CircleDashed,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      description: 'Active & archived portfolio tasks',
    },
    {
      id: 'stat-completed',
      label: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      description: 'Done and verified',
    },
    {
      id: 'stat-remaining',
      label: 'Remaining',
      value: stats.remainingTasks,
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      description: 'Pending completion',
    },
    {
      id: 'stat-rate',
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: Sparkles,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      description: 'Progress this sprint',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.id}
            id={item.id}
            className="flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {item.value}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 truncate">
                {item.description}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
