'use client';

import { useState, useCallback } from 'react';
import { token } from '@atlaskit/tokens';
import AppHeader from '@/components/AppHeader';
import WeeklyGrid from '@/components/WeeklyGrid';
import CalendarView from '@/components/calendar/CalendarView';
import MonthlyReportView from '@/components/MonthlyReportView';
import TeamDashboard from '@/components/TeamDashboard';
import { useProjects } from '@/hooks/useProjects';

type ViewMode = 'grid' | 'calendar' | 'report' | 'dashboard';

const VIEW_MODES: ViewMode[] = ['grid', 'calendar', 'report', 'dashboard'];

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>('grid');
  const { projects, selectedProject, setSelectedProject, isLoading: isLoadingProjects } = useProjects();

  const handleViewChange = useCallback((view: ViewMode) => {
    setActiveView(view);
  }, []);

  const showProjectSelector =
    activeView === 'grid' || activeView === 'calendar' || activeView === 'dashboard';

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: token('elevation.surface.sunken') }}>
      <AppHeader
        activeView={activeView}
        onViewChange={handleViewChange}
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        isLoadingProjects={isLoadingProjects}
        showProjectSelector={showProjectSelector}
      />

      <main className="flex-1 px-5 py-6 max-w-[1600px] mx-auto w-full">
        {activeView === 'grid' && (
          <WeeklyGrid projectKey={selectedProject?.key} />
        )}

        {activeView === 'calendar' && (
          <div style={{ height: 'calc(100vh - 5rem)' }}>
            <CalendarView issues={[]} projectKey={selectedProject?.key} />
          </div>
        )}

        {activeView === 'report' && (
          <MonthlyReportView />
        )}

        {activeView === 'dashboard' && (
          <TeamDashboard />
        )}
      </main>
    </div>
  );
}
