'use client';

import type { JiraProject } from '@/src/types/jira';

interface ProjectSelectorProps {
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  onSelect: (project: JiraProject) => void;
  isLoading?: boolean;
}

export default function ProjectSelector({
  projects,
  selectedProject,
  onSelect,
  isLoading,
}: ProjectSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-sm text-gray-500">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <span className="text-sm text-gray-400">No projects available</span>
    );
  }

  return (
    <select
      value={selectedProject?.key ?? ''}
      onChange={(e) => {
        const project = projects.find((p) => p.key === e.target.value);
        if (project) onSelect(project);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {projects.map((p) => (
        <option key={p.key} value={p.key}>
          {p.name} ({p.key})
        </option>
      ))}
    </select>
  );
}
