'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import WeeklyGrid from '@/components/WeeklyGrid';
import CalendarView from '@/components/calendar/CalendarView';
import ProjectSelector from '@/components/ProjectSelector';
import { useProjects } from '@/hooks/useProjects';
import type { JiraIssue } from '@/src/types/jira';

type ViewMode = 'grid' | 'calendar';

async function fetchCalendarIssues(projectKey?: string): Promise<JiraIssue[]> {
  let issuesRes: Response;
  if (projectKey) {
    const jql = `project = "${projectKey}" ORDER BY updated DESC`;
    issuesRes = await fetch(`/api/issues?jql=${encodeURIComponent(jql)}&maxResults=50`);
  } else {
    issuesRes = await fetch('/api/my-issues');
  }
  if (!issuesRes.ok) throw new Error('Failed to fetch issues');
  const issuesData = await issuesRes.json();
  return issuesData.issues || [];
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>('grid');
  const { projects, selectedProject, setSelectedProject, isLoading: isLoadingProjects } = useProjects();

  // Calendar issues query — only enabled when calendar view is active
  const {
    data: issues = [],
    isLoading: isLoadingCalendar,
    refetch: refetchCalendarData,
  } = useQuery({
    queryKey: ['calendar-issues', selectedProject?.key ?? null],
    queryFn: () => fetchCalendarIssues(selectedProject?.key),
    enabled: activeView === 'calendar',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jira Time Logger</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeView === 'grid'
                ? 'Weekly timesheet — view your logged hours across issues'
                : 'Calendar view — drag and drop time blocks'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Project selector */}
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject}
              onSelect={setSelectedProject}
              isLoading={isLoadingProjects}
            />
            {/* View toggle tabs */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
              <button
                onClick={() => setActiveView('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Weekly Grid
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View content */}
      {activeView === 'grid' ? (
        <WeeklyGrid projectKey={selectedProject?.key} />
      ) : (
        <div className="h-[calc(100vh-180px)]">
          {isLoadingCalendar && issues.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-500">Loading calendar data...</span>
            </div>
          ) : (
            <CalendarView
              issues={issues}
              projectKey={selectedProject?.key}
            />
          )}
        </div>
      )}
    </div>
  );
}
