'use client';

import { token } from '@atlaskit/tokens';
import Select from '@atlaskit/select';
import Spinner from '@atlaskit/spinner';
import type { JiraProject } from '@/src/types/jira';

interface ProjectSelectorProps {
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  onSelect: (project: JiraProject | null) => void;
  isLoading?: boolean;
}

const ALL_PROJECTS_OPTION = { label: 'All Projects', value: '__all__' };

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
        <span className="text-sm" style={{ color: token('color.text.subtlest') }}>Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <span className="text-sm" style={{ color: token('color.text.disabled') }}>No projects available</span>
    );
  }

  const projectOptions = projects.map((p) => ({
    label: `${p.name} (${p.key})`,
    value: p.key,
  }));

  const options = [ALL_PROJECTS_OPTION, ...projectOptions];

  const selectedOption =
    selectedProject
      ? options.find((o) => o.value === selectedProject.key) ?? ALL_PROJECTS_OPTION
      : ALL_PROJECTS_OPTION;

  return (
    <div style={{ minWidth: 200 }}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option: { label: string; value: string } | null) => {
          if (!option || option.value === '__all__') {
            onSelect(null);
          } else {
            const project = projects.find((p) => p.key === option.value);
            if (project) onSelect(project);
          }
        }}
        spacing="compact"
        placeholder="Select project..."
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        styles={{ menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }) }}
      />
    </div>
  );
}
