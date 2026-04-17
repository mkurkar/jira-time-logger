'use client';

import Select from '@atlaskit/select';
import Spinner from '@atlaskit/spinner';
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
        <Spinner size="small" />
        <span className="text-sm text-gray-500">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <span className="text-sm text-gray-400">No projects available</span>
    );
  }

  const options = projects.map((p) => ({
    label: `${p.name} (${p.key})`,
    value: p.key,
  }));

  const selectedOption = options.find((o) => o.value === selectedProject?.key) ?? null;

  return (
    <div style={{ minWidth: 200 }}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option: { label: string; value: string } | null) => {
          if (option) {
            const project = projects.find((p) => p.key === option.value);
            if (project) onSelect(project);
          }
        }}
        spacing="compact"
        placeholder="Select project..."
      />
    </div>
  );
}
