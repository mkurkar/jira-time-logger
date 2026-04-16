'use client';

import { useState } from 'react';
import WeeklyGrid from '@/components/WeeklyGrid';
import CalendarView from '@/components/calendar/CalendarView';
import ProjectSelector from '@/components/ProjectSelector';
import { useProjects } from '@/hooks/useProjects';

type ViewMode = 'grid' | 'calendar';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>('grid');
  const { projects, selectedProject, setSelectedProject, isLoading: isLoadingProjects } = useProjects();

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
          <CalendarView
            issues={[]}
            projectKey={selectedProject?.key}
          />
        </div>
      )}
    </div>
  );
}
