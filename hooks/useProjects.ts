'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JiraProject } from '@/src/types/jira';

async function fetchProjects(): Promise<JiraProject[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects || [];
}

export function useProjects() {
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);

  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes — projects rarely change
  });

  // Auto-select first project when data arrives and nothing is selected
  if (!selectedProject && projects.length > 0) {
    // Use setTimeout to avoid setState during render
    setTimeout(() => setSelectedProject(projects[0]), 0);
  }

  return {
    projects,
    selectedProject,
    setSelectedProject,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
