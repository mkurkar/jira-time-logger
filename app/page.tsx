'use client';

import { useState, useCallback } from 'react';
import { token } from '@atlaskit/tokens';
import Tabs, { Tab, TabList } from '@atlaskit/tabs';
import WeeklyGrid from '@/components/WeeklyGrid';
import CalendarView from '@/components/calendar/CalendarView';
import ProjectSelector from '@/components/ProjectSelector';
import { useProjects } from '@/hooks/useProjects';

type ViewMode = 'grid' | 'calendar';

const VIEW_MODES: ViewMode[] = ['grid', 'calendar'];

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>('grid');
  const { projects, selectedProject, setSelectedProject, isLoading: isLoadingProjects } = useProjects();

  const handleTabChange = useCallback((index: number) => {
    setActiveView(VIEW_MODES[index]);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: token('color.text') }}>Jira Time Logger</h1>
            <p className="text-sm mt-1" style={{ color: token('color.text.subtlest') }}>
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
            <Tabs
              selected={VIEW_MODES.indexOf(activeView)}
              onChange={handleTabChange}
              id="view-tabs"
            >
              <TabList>
                <Tab>Weekly Grid</Tab>
                <Tab>Calendar</Tab>
              </TabList>
            </Tabs>
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
