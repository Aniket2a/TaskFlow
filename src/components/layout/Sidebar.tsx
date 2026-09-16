import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Folder,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  X,
  LogIn,
  Cloud,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { NavigationTab, Project } from '../../types';
import { cn } from '../../lib/utils';
import { getSidebarCounts } from '../../lib/taskFilters';
import { ProjectModal } from '../projects/ProjectModal';
import { WorkspaceDetailsModal } from '../projects/WorkspaceDetailsModal';
import { Button } from '../ui/Button';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    activeTab,
    selectedProjectId,
    projects,
    tasks,
    user,
    theme,
    isDesktopSidebarCollapsed,
    isMobileSidebarOpen,
    isProjectModalOpen,
    setActiveTab,
    setSelectedProject,
    toggleDesktopSidebar,
    setMobileSidebarOpen,
    setTheme,
    setTaskModalOpen,
    setAuthModalOpen,
    setProjectModalOpen,
    deleteProject,
  } = useTaskFlowStore();

  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Close workspace actions menu on click outside or escape key
  useEffect(() => {
    if (!openMenuProjectId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.workspace-actions-menu-container')) {
        setOpenMenuProjectId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuProjectId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuProjectId]);

  const {
    inbox: inboxCount,
    today: todayCount,
    upcoming: upcomingCount,
    completed: completedCount,
  } = getSidebarCounts(tasks);

  const mainNavigation: {
    id: NavigationTab;
    path: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'overview', path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', path: '/inbox', label: 'Inbox', icon: Inbox, badge: inboxCount },
    { id: 'today', path: '/today', label: 'Today', icon: Calendar, badge: todayCount },
    { id: 'upcoming', path: '/upcoming', label: 'Upcoming', icon: CalendarDays, badge: upcomingCount },
    { id: 'completed', path: '/completed', label: 'Completed', icon: CheckCircle2, badge: completedCount },
  ];

  const isTabActive = (item: typeof mainNavigation[0]) => {
    const currentPath = location.pathname;
    if (selectedProjectId || currentPath.startsWith('/project/')) return false;
    if (item.id === 'overview') {
      return currentPath === '/' || currentPath === '/overview';
    }
    return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
  };

  const handleNavClick = (tab: NavigationTab, path: string) => {
    setActiveTab(tab);
    setSelectedProject(null);
    setMobileSidebarOpen(false);
    navigate(path);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setMobileSidebarOpen(false);
    navigate(`/project/${projectId}`);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200/80 dark:border-zinc-800 transition-all duration-200">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            TF
          </div>
          {!isDesktopSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                TaskFlow
              </span>
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-normal truncate">
                Plan smarter. Focus better.
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          id="mobile-close-sidebar-btn"
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Add Task Button */}
      <div className="px-3 pt-3">
        <Button
          id="sidebar-create-task-btn"
          onClick={() => setTaskModalOpen(true)}
          className={cn(
            'w-full justify-center transition-all',
            isDesktopSidebarCollapsed ? 'px-0' : 'px-3'
          )}
          size="sm"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isDesktopSidebarCollapsed && <span>New Task</span>}
        </Button>
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          {!isDesktopSidebarCollapsed && (
            <div className="px-2 mb-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Main
            </div>
          )}
          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isTabActive(item);
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id, item.path)}
                  title={isDesktopSidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group relative select-none cursor-pointer',
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200'
                    )}
                  />
                  {!isDesktopSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-medium',
                            isActive
                              ? 'bg-zinc-200/80 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Projects Section */}
        <div>
          {!isDesktopSidebarCollapsed && (
            <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              <span>Workspaces</span>
              <button
                id="add-project-btn"
                onClick={() => setProjectModalOpen(true, null)}
                className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Create Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <nav className="space-y-1">
            {projects.map((project) => {
              const isProjActive =
                location.pathname === `/project/${project.id}` ||
                (activeTab === 'project' && selectedProjectId === project.id);
              const projectTaskCount = tasks.filter((t) => t.projectId === project.id).length;

              if (isDesktopSidebarCollapsed) {
                return (
                  <button
                    key={project.id}
                    id={`project-nav-${project.id}`}
                    onClick={() => handleProjectClick(project.id)}
                    title={project.name}
                    aria-label={`Workspace ${project.name}`}
                    className={cn(
                      'w-full flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer',
                      isProjActive
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                  </button>
                );
              }

              const isMenuOpen = openMenuProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className={cn(
                    'workspace-actions-menu-container group relative flex items-center rounded-lg text-sm font-medium transition-colors select-none',
                    isProjActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
                    isMenuOpen && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  <button
                    id={`project-nav-${project.id}`}
                    onClick={() => handleProjectClick(project.id)}
                    className="flex-1 flex items-center gap-3 px-2.5 py-2 text-left truncate cursor-pointer focus:outline-hidden"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-transparent transition-all"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    <span
                      className={cn(
                        'text-xs text-zinc-500 dark:text-zinc-400 transition-opacity',
                        isMenuOpen ? 'hidden' : 'group-hover:hidden'
                      )}
                    >
                      {projectTaskCount}
                    </span>
                  </button>

                  <div className="relative pr-1.5 flex items-center">
                    <button
                      type="button"
                      id={`project-actions-btn-${project.id}`}
                      aria-label="Workspace actions"
                      aria-haspopup="true"
                      aria-expanded={isMenuOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setOpenMenuProjectId(isMenuOpen ? null : project.id);
                      }}
                      className={cn(
                        'p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 dark:hover:text-zinc-200 dark:hover:bg-zinc-700/60 transition-all cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500',
                        isMenuOpen
                          ? 'opacity-100 text-zinc-700 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-700/60'
                          : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                      )}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Compact More Actions Dropdown */}
                    {isMenuOpen && (
                      <div
                        role="menu"
                        aria-orientation="vertical"
                        className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100"
                      >
                        <button
                          role="menuitem"
                          type="button"
                          id={`project-details-btn-${project.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuProjectId(null);
                            setDetailsProject(project);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>View details</span>
                        </button>

                        <button
                          role="menuitem"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuProjectId(null);
                            setProjectModalOpen(true, project);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Edit workspace</span>
                        </button>

                        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                        <button
                          role="menuitem"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuProjectId(null);
                            setProjectToDelete(project);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete workspace</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-zinc-200/60 dark:border-zinc-800 space-y-1.5">
        {/* Settings Button */}
        <button
          id="nav-settings-btn"
          onClick={() => handleNavClick('settings', '/settings')}
          title="Settings"
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-colors cursor-pointer',
            location.pathname === '/settings' && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          )}
        >
          <Settings className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
          {!isDesktopSidebarCollapsed && <span className="flex-1 text-left">Settings</span>}
        </button>

        {/* Theme Toggle */}
        <button
          id="toggle-theme-btn"
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 shrink-0 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 shrink-0 text-zinc-500" />
          )}
          {!isDesktopSidebarCollapsed && (
            <span className="flex-1 text-left">{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
          )}
        </button>

        {/* User Profile Card (Clickable to open Auth / Account) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setAuthModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAuthModalOpen(true);
            }
          }}
          className={cn(
            'mt-2 pt-2 border-t border-zinc-200/40 dark:border-zinc-800/60 flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500',
            !isDesktopSidebarCollapsed && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
          title={user ? 'Manage Account & Cloud Sync' : 'Sign in to TaskFlow'}
          aria-label={user ? `Signed in as ${user.name}` : 'Sign in to TaskFlow'}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <LogIn className="w-4 h-4" />}
            </div>
          )}
          {!isDesktopSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user ? user.name : 'Sign In'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500' : 'bg-amber-400'}`}
                />
                <span>{user ? (user.email ? 'Cloud Synced' : 'Guest') : 'Local Mode'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex justify-end pt-1">
          <button
            id="desktop-collapse-sidebar-btn"
            onClick={toggleDesktopSidebar}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isDesktopSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Project Creation / Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setProjectModalOpen(false, null)}
      />

      {/* Workspace Details Modal */}
      <WorkspaceDetailsModal
        isOpen={!!detailsProject}
        project={detailsProject}
        onClose={() => setDetailsProject(null)}
      />

      {/* Delete Workspace Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Delete Workspace
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Confirm workspace deletion</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">{projectToDelete.name}</span>?
              Tasks belonging to this workspace will <span className="font-semibold text-zinc-900 dark:text-zinc-200">not</span> be deleted; they will simply be unassigned and kept in your tasks.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeletingProject}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isDeletingProject}
                onClick={async () => {
                  setIsDeletingProject(true);
                  try {
                    await deleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                  } catch (err) {
                    console.error('Failed to delete workspace:', err);
                  } finally {
                    setIsDeletingProject(false);
                  }
                }}
              >
                {isDeletingProject ? 'Deleting...' : 'Delete Workspace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block transition-all duration-200 shrink-0 h-screen sticky top-0',
          isDesktopSidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Container */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
