'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { setBooleanFeatureFlagResolver } from '@atlaskit/platform-feature-flags';

// Enable Atlaskit's React 18+ portal fix. Without this, portals (used by modals,
// dropdowns, flags) fall back to a legacy code path that requires an extra render
// cycle, causing slow or broken dialogs.
setBooleanFeatureFlagResolver((flag) =>
  flag === 'platform_design_system_team_portal_logic_r18_fix'
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute default
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
