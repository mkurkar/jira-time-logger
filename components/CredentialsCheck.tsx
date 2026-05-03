'use client';

import { useEffect, useState } from 'react';
import { token } from '@atlaskit/tokens';

/**
 * Silently pings /api/myself on mount. If it returns 401 or a network error,
 * shows a dismissible banner explaining how to configure credentials.
 */
export default function CredentialsCheck() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/myself')
      .then(async (res) => {
        if (res.status === 401) {
          setMessage(
            'Jira authentication failed. Check JIRA_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN in your .env.local file.',
          );
          setShow(true);
        } else if (!res.ok && res.status !== 200) {
          const data = await res.json().catch(() => ({}));
          if (data?.error) {
            setMessage(data.error);
            setShow(true);
          }
        }
      })
      .catch(() => {
        setMessage(
          'Could not reach the Jira API. Make sure your .env.local credentials are configured.',
        );
        setShow(true);
      });
  }, []);

  if (!show) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 56, // below the sticky header (h-14 = 56px)
        left: 0,
        right: 0,
        zIndex: 9998,
        backgroundColor: token('color.background.warning'),
        borderBottom: `2px solid ${token('color.border.warning')}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Warning icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0, marginTop: 1 }}
          aria-hidden="true"
        >
          <path
            d="M10 2L1.5 17h17L10 2z"
            stroke={token('color.icon.warning')}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line x1="10" y1="8" x2="10" y2="12.5" stroke={token('color.icon.warning')} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="14.5" r="0.75" fill={token('color.icon.warning')} />
        </svg>

        <div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: token('color.text.warning'),
              display: 'block',
              lineHeight: 1.4,
            }}
          >
            Configuration issue
          </span>
          <span
            style={{
              fontSize: 12,
              color: token('color.text'),
              lineHeight: 1.5,
            }}
          >
            {message}
          </span>
        </div>
      </div>

      <button
        onClick={() => setShow(false)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: `1px solid ${token('color.border.warning')}`,
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          color: token('color.text.warning'),
          padding: '3px 10px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          lineHeight: 1.5,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
