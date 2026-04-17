'use client';

import { useState } from 'react';
import Button from '@atlaskit/button/new';
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
            <div className="flex rounded-lg overflow-hidden">
              <Button
                onClick={() => setActiveView('grid')}
                appearance={activeView === 'grid' ? 'primary' : 'default'}
              >
                Weekly Grid
              </Button>
              <Button
                onClick={() => setActiveView('calendar')}
                appearance={activeView === 'calendar' ? 'primary' : 'default'}
              >
                Calendar
              </Button>
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
