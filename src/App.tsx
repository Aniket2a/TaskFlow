import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { TaskListView } from './components/views/TaskListView';
import { SettingsView } from './components/views/SettingsView';
import { TaskModal } from './components/tasks/TaskModal';
import { AuthModal } from './components/auth/AuthModal';
import { useTaskFlowStore, applyThemeToDOM } from './store/useTaskFlowStore';
import { subscribeToAuth, subscribeToUserTasks } from './lib/firebase';

export default function App() {
  const location = useLocation();
  const {
    theme,
    setTheme,
    setUser,
    setCloudSynced,
    setActiveTab,
    setSelectedProject,
  } = useTaskFlowStore();

  // Synchronize router location with TaskFlow store state
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '');
    if (path.startsWith('project/')) {
      const projId = path.split('/')[1];
      setActiveTab('project');
      setSelectedProject(projId || null);
    } else if (['overview', 'inbox', 'today', 'upcoming', 'completed', 'settings'].includes(path)) {
      setActiveTab(path as any);
      setSelectedProject(null);
    } else if (path === '') {
      setActiveTab('overview');
      setSelectedProject(null);
    }
  }, [location.pathname, setActiveTab, setSelectedProject]);

  // Initialize theme preference and listen to system changes when in system mode
  useEffect(() => {
    applyThemeToDOM(theme);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        applyThemeToDOM('system');
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme]);

  // Subscribe to Firebase Authentication & Realtime User Tasks
  useEffect(() => {
    let unsubscribeTasks: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setCloudSynced(true);

        if (unsubscribeTasks) {
          unsubscribeTasks();
        }

        unsubscribeTasks = subscribeToUserTasks(
          firebaseUser.id,
          (realtimeTasks) => {
            useTaskFlowStore.setState({
              tasks: realtimeTasks || [],
              isCloudSynced: true,
              apiError: null,
            });
          },
          (err) => {
            console.warn('Realtime tasks listener warning:', err);
            useTaskFlowStore.setState({
              isCloudSynced: false,
              apiError: 'Realtime sync disconnected. Please check your network.',
            });
          }
        );
      } else {
        if (unsubscribeTasks) {
          unsubscribeTasks();
          unsubscribeTasks = null;
        }
        setUser(null);
        setCloudSynced(false);
      }
    });

    return () => {
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
      unsubscribeAuth();
    };
  }, [setUser, setCloudSynced]);

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Responsive Sidebar (collapsible desktop + drawer mobile) */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        {/* Dynamic Page Content with React Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewDashboard />} />
            <Route path="/inbox" element={<TaskListView viewType="inbox" />} />
            <Route path="/today" element={<TaskListView viewType="today" />} />
            <Route path="/upcoming" element={<TaskListView viewType="upcoming" />} />
            <Route path="/completed" element={<TaskListView viewType="completed" />} />
            <Route path="/project/:projectId" element={<TaskListView viewType="project" />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Global Task Creation & Editing Modal */}
      <TaskModal />

      {/* Global Firebase Auth Modal */}
      <AuthModal />
    </div>
  );
}
