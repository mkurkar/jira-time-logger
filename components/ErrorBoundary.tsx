'use client';

import React from 'react';

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error.message ?? '';
      const isAuth = msg.toLowerCase().includes('authentication') || msg.includes('401');
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ maxWidth: 520, width: '100%' }}>
            <div
              style={{
                padding: '32px 36px',
                borderRadius: 8,
                border: '1px solid #FFBDAD',
                background: '#FFEBE6',
              }}
            >
              <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#BF2600', fontWeight: 700 }}>
                {isAuth ? 'Authentication error' : 'Something went wrong'}
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#5E4B3C' }}>
                {isAuth
                  ? 'Could not authenticate with Jira. Check that your credentials in .env.local are correct.'
                  : msg || 'An unexpected error occurred.'}
              </p>

              {isAuth && (
                <pre
                  style={{
                    background: '#fff',
                    border: '1px solid #FFBDAD',
                    borderRadius: 4,
                    padding: '12px 14px',
                    fontSize: 12,
                    color: '#172B4D',
                    overflowX: 'auto',
                    marginBottom: 16,
                  }}
                >
{`# .env.local
JIRA_URL=https://your-org.atlassian.net
JIRA_USER_EMAIL=you@example.com
JIRA_API_TOKEN=your-api-token-here`}
                </pre>
              )}

              <button
                onClick={() => this.setState({ error: null })}
                style={{
                  padding: '7px 18px',
                  background: '#BF2600',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
