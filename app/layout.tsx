import type { Metadata } from 'next';
import { token } from '@atlaskit/tokens';
import '@atlaskit/css-reset';
import Providers from './providers';
import ErrorBoundary from '@/components/ErrorBoundary';
import CredentialsCheck from '@/components/CredentialsCheck';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jira Time Logger',
  description: 'Weekly timesheet grid for Jira work log tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{
          backgroundColor: token('elevation.surface.sunken'),
          color: token('color.text'),
        }}
      >
        <Providers>
          <ErrorBoundary>
            <CredentialsCheck />
            <main className="min-h-screen">
              {children}
            </main>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
