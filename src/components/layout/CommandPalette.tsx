import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Settings,
  Moon,
  Sun,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { NavigationTab } from '../../types';
import { filterTasksWithSecondaryFilters } from '../../lib/taskFilters';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    setSelectedProject,
    theme,
    setTheme,
    tasks,
    projects,
  } = useTaskFlowStore();

  const [input, setInput] = useState('');

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    setSelectedProject(null);
    setCommandPaletteOpen(false);
    setInput('');
    navigate(`/${tab === 'overview' ? 'overview' : tab}`);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setCommandPaletteOpen(false);
    setInput('');
    navigate(`/project/${projectId}`);
  };

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
    setCommandPaletteOpen(false);
  };

  const filteredTasks = input.trim()
    ? filterTasksWithSecondaryFilters(tasks, { searchQuery: input }, projects)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            id="command-palette-input"
            type="text"
            placeholder="Type a command or search tasks..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-sm">
          {/* If searching tasks */}
          {filteredTasks.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Matching Tasks
              </div>
              {filteredTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setActiveTab('today');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 group transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                    />
                    <span className="truncate">{task.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Quick Actions
          </div>

          <button
            id="cmd-create-task"
            onClick={() => {
              setCommandPaletteOpen(false);
              useTaskFlowStore.getState().setTaskModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors font-medium text-indigo-600 dark:text-indigo-400"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task...</span>
          </button>

          <button
            id="cmd-auth-account"
            onClick={() => {
              setCommandPaletteOpen(false);
              useTaskFlowStore.getState().setAuthModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <Settings className="w-4 h-4 text-emerald-500" />
            <span>Firebase Cloud Account & Sync...</span>
          </button>

          <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Navigation
          </div>

          <button
            id="cmd-goto-overview"
            onClick={() => handleNavigate('overview')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-zinc-500" />
            <span>Go to Overview</span>
          </button>

          <button
            id="cmd-goto-today"
            onClick={() => handleNavigate('today')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>Go to Today</span>
          </button>

          <button
            id="cmd-goto-upcoming"
            onClick={() => handleNavigate('upcoming')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-zinc-500" />
            <span>Go to Upcoming</span>
          </button>

          <button
            id="cmd-goto-completed"
            onClick={() => handleNavigate('completed')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-zinc-500" />
            <span>Go to Completed</span>
          </button>

          {/* Projects */}
          <div className="pt-2">
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Projects
            </div>
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => handleSelectProject(proj.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
                <span>{proj.name}</span>
              </button>
            ))}
          </div>

          {/* System toggles */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              id="cmd-toggle-theme"
              onClick={handleToggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-500" />
              )}
              <span>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
            </button>

            <button
              id="cmd-goto-settings"
              onClick={() => handleNavigate('settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-500" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
