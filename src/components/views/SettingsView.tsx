import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Moon,
  Sun,
  Laptop,
  Check,
  Bell,
  Sliders,
  Cloud,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
  Database,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { seedSampleDataForUser } from '../../services/seedDemo';

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    tasks,
    projects,
    tags,
    user,
    setAuthModalOpen,
    handleSignOut,
    isCloudSynced,
    loadUserData,
    setSyncNotice,
  } = useTaskFlowStore();
  const [defaultPriority, setDefaultPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [startWeekOn, setStartWeekOn] = useState<'monday' | 'sunday'>('monday');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const showNotificationFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await loadUserData();
      setSyncNotice('Synchronized with Firestore database');
      showNotificationFeedback('Synced successfully with cloud database!');
    } catch (err) {
      showNotificationFeedback('Sync encountered a warning.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedSampleDataForUser();
      await loadUserData();
      showNotificationFeedback(
        `Successfully loaded ${res.createdTasks} sample tasks and ${res.createdProjects} workspaces!`
      );
    } catch (err: any) {
      showNotificationFeedback('Error generating sample tasks: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      user: user || { mode: 'guest' },
      tasks,
      projects,
      tags,
      preferences: {
        theme,
        defaultPriority,
        startWeekOn,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotificationFeedback('Configuration & task data exported successfully as JSON!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Manage your personal workspace, cloud sync, appearance, and task preferences
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Cloud & Authentication Section */}
      <Card className="space-y-4">
        <div className="border-b border-zinc-200/80 dark:border-zinc-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Cloud Database & Authentication
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Cloud Firestore with user-scoped isolation (users/&#123;uid&#125;)
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCloudSynced ? 'Synced' : 'Local'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {user ? user.name : 'Not Signed In'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {user?.email || 'Local session (Sign in to sync across devices)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing || !user}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setAuthModalOpen(true)}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{user ? 'Switch Account' : 'Sign In'}</span>
            </Button>

            {user && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSignOut}
                className="text-rose-600 hover:text-rose-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Demo & Sample Data Management */}
      <Card className="space-y-4">
        <div className="border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Demo & Sample Tasks
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Load realistic sample coursework and capstone tasks to test the dashboard and filters
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Populate Sample Student Tasks
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Creates CS Capstone, Distributed Systems, and Career workspaces with realistic tasks
            </div>
          </div>
          <Button
            id="seed-sample-tasks-btn"
            onClick={handleSeedData}
            variant="outline"
            size="sm"
            disabled={isSeeding}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Creating tasks...' : 'Load Sample Data'}</span>
          </Button>
        </div>
      </Card>

      {/* Appearance Section */}
      <Card className="space-y-4">
        <div className="border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sun className="w-4 h-4 text-zinc-500" /> Appearance
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Choose your preferred color mode for TaskFlow
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Appearance options"
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3"
        >
          {(['light', 'dark', 'system'] as const).map((mode) => {
            const isSelected = theme === mode;
            return (
              <button
                key={mode}
                id={`theme-option-${mode}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setTheme(mode)}
                onKeyDown={(e) => {
                  const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
                  const currentIndex = modes.indexOf(mode);
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    setTheme(nextMode);
                    document.getElementById(`theme-option-${nextMode}`)?.focus();
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevMode = modes[(currentIndex - 1 + modes.length) % modes.length];
                    setTheme(prevMode);
                    document.getElementById(`theme-option-${prevMode}`)?.focus();
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600 dark:ring-indigo-500 font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {mode === 'light' && <Sun className="w-4 h-4 shrink-0" />}
                {mode === 'dark' && <Moon className="w-4 h-4 shrink-0" />}
                {mode === 'system' && <Laptop className="w-4 h-4 shrink-0" />}
                <span>{mode}</span>
                {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="space-y-4">
        <div className="border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-500" /> Notifications & Reminders
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Browser alerts and task deadline reminders
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">Task Due Reminders</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Browser push notifications are currently unavailable in this environment
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Not configured
          </span>
        </div>
      </Card>

      {/* Data Backup */}
      <Card className="space-y-4">
        <div className="border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Download className="w-4 h-4 text-zinc-500" /> Data Backup & Portability
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Export all student tasks, projects, and personal records as JSON
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Export Workspace Data</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Download a full JSON snapshot of all entities</div>
          </div>
          <Button
            id="export-data-json-btn"
            onClick={handleExportJSON}
            variant="outline"
            size="sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
