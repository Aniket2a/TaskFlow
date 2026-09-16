import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useTaskFlowStore } from '../../store/useTaskFlowStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

export const ProjectsOverview: React.FC = () => {
  const navigate = useNavigate();
  const { projects, tasks, setSelectedProject } = useTaskFlowStore();

  const handleCardClick = (projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Project Workspaces
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Active velocity across academic & project goals
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
          No workspaces yet. Create one from the sidebar to organize your tasks.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {projects.map((project) => {
            // Derive real progress strictly from tasks belonging to this workspace
            const workspaceTasks = tasks.filter((t) => t.projectId === project.id);
            const total = workspaceTasks.length;
            const completed = workspaceTasks.filter((t) => t.status === 'completed').length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => handleCardClick(project.id)}
                className="group cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {project.name}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
                  </div>

                  {project.description ? (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-1">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-1.5 line-clamp-1">
                      No description
                    </p>
                  )}

                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <strong className="text-zinc-900 dark:text-zinc-100 font-medium">
                        {completed}
                      </strong>{' '}
                      of {total} completed
                    </span>
                    <span
                      className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums"
                      aria-label={`${percentage} percent completed`}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <ProgressBar
                    value={percentage}
                    color={project.color}
                    height="sm"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
