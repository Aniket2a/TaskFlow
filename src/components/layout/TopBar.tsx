import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Command,
  Plus,
  AlertCircle,
  Cloud,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { getTodayTasks } from '../../lib/taskFilters';
import { Button } from '../ui/Button';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const {
    activeTab,
    selectedProjectId,
    projects,
    tasks,
    user,
    setCommandPaletteOpen,
    setMobileSidebarOpen,
    searchQuery,
    setTaskModalOpen,
    setAuthModalOpen,
    handleSignOut,
    isCloudSynced,
    syncNotice,
    apiError,
  } = useTaskFlowStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Derive current title from route and store
  let currentTitle = 'Overview';
  const path = location.pathname.replace(/^\//, '');

  if (path.startsWith('project/')) {
    const projId = path.split('/')[1] || selectedProjectId;
    const proj = projects.find((p) => p.id === projId);
    currentTitle = proj ? proj.name : 'Workspace';
  } else if (path === 'inbox' || activeTab === 'inbox') {
    currentTitle = 'Inbox';
  } else if (path === 'today' || activeTab === 'today') {
    currentTitle = 'Today';
  } else if (path === 'upcoming' || activeTab === 'upcoming') {
    currentTitle = 'Upcoming';
  } else if (path === 'completed' || activeTab === 'completed') {
    currentTitle = 'Completed';
  } else if (path === 'settings' || activeTab === 'settings') {
    currentTitle = 'Settings';
  } else {
    currentTitle = 'Overview';
  }

  const dueTasksToday = getTodayTasks(tasks);

  return (
    <header className="h-16 px-4 sm:px-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="open-mobile-sidebar-btn"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden p-2 -ml-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-[130px] sm:max-w-xs">
            {currentTitle}
          </h1>

          {/* Cloud Sync Status Badge */}
          <div
            title={`Firebase Project: to-do-app-c95ac (${isCloudSynced ? 'Synced' : 'Not Synced'})`}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
              isCloudSynced
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isCloudSynced ? 'Firebase Synced' : 'Sync Pending'}</span>
          </div>
        </div>
      </div>

      {/* Center/Right: Global Search, New Task, Notification & Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Toast Feedback */}
        {syncNotice && (
          <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/40 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Error Toast Feedback */}
        {apiError && !syncNotice && (
          <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Quick Search trigger button */}
        <button
          id="global-search-trigger"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/80 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all text-sm w-28 sm:w-44 lg:w-56 group cursor-pointer"
        >
          <Search className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-400" />
          <span className="truncate text-xs sm:text-sm">
            {searchQuery ? searchQuery : 'Search tasks...'}
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[10px] font-medium font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Create Task Quick Action */}
        <Button
          id="quick-create-task-btn"
          onClick={() => setTaskModalOpen(true)}
          size="sm"
          className="hidden sm:inline-flex shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </Button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {dueTasksToday.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-zinc-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Today's Reminders
                </span>
                <span className="text-[11px] text-zinc-500">
                  {dueTasksToday.length} {dueTasksToday.length === 1 ? 'task' : 'tasks'} due
                </span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-64 overflow-y-auto">
                {dueTasksToday.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">All caught up!</p>
                    <p className="mt-0.5">No tasks due today.</p>
                  </div>
                ) : (
                  dueTasksToday.map((task) => (
                    <div key={task.id} className="py-2.5 first:pt-2 last:pb-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {task.title}
                        </p>
                        <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {task.dueTime ? task.dueTime : task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Dropdown */}
        {!user ? (
          <Button
            id="topbar-signin-btn"
            onClick={() => setAuthModalOpen(true)}
            size="sm"
            className="text-xs h-8 px-3"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Button>
        ) : (
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              aria-label="User profile menu"
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all cursor-pointer"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {user.email || 'Guest Mode'}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Cloud Sync Active</span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Switch Account</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowUserDropdown(false);
                      await handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
