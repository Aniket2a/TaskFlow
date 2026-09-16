import React from 'react';
import { Flame, Zap, Trophy, ArrowRight } from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';

export const StreakBanner: React.FC = () => {
  const { getDashboardStats } = useTaskFlowStore();
  const stats = getDashboardStats();

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {stats.streakDays} day {stats.streakDays === 1 ? 'streak' : 'streak'}!
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Consistent focus
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            {stats.streakDays > 0
              ? `You've completed tasks ${stats.streakDays} consecutive ${stats.streakDays === 1 ? 'day' : 'days'}. Keep your momentum going!`
              : "Complete at least one task today to start your daily streak!"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-400 shrink-0 self-end sm:self-center">
        <Trophy className="w-3.5 h-3.5" />
        <span>Top 5% student pace</span>
      </div>
    </div>
  );
};
