'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useEffect, useRef } from 'react';
import { setBooleanFeatureFlagResolver } from '@atlaskit/platform-feature-flags';
import { setGlobalTheme } from '@atlaskit/tokens';

// Enable Atlaskit's React 18+ portal fix.
if (typeof document !== 'undefined') {
  setBooleanFeatureFlagResolver((flag) =>
    flag === 'platform_design_system_team_portal_logic_r18_fix'
  );

  setGlobalTheme({
    colorMode: 'light',
    light: 'light',
    dark: 'dark',
    spacing: 'spacing',
    typography: 'typography',
    shape: 'shape',
  });
}

// Singleton query client — lives outside React tree so it persists across HMR
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minute
      gcTime: 30 * 60 * 1000,    // 30 minutes in memory
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const persistedRef = useRef(false);

  useEffect(() => {
    if (persistedRef.current) return;
    persistedRef.current = true;

    // Set up localStorage persistence — only runs on client
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'JIRA_QUERY_CACHE',
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persistQueryClient({
      queryClient: queryClient as any,
      persister,
      maxAge: 30 * 60 * 1000, // 30 minutes
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          const key = (query.queryKey as unknown[])[0];
          // Only persist report/dashboard queries across refreshes
          return key === 'monthly-report' || key === 'team-dashboard';
        },
      },
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
