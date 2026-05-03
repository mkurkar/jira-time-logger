'use client';

import { useEffect, useState } from 'react';

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
          setMessage('Jira authentication failed. Check JIRA_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN in your .env.local file.');
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
        setMessage('Could not reach the Jira API. Make sure your .env.local credentials are configured.');
        setShow(true);
      });
  }, []);

  if (!show) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#FFFAE6',
        borderBottom: '2px solid #F6C900',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        fontSize: 13,
        color: '#172B4D',
      }}
    >
      <span>
        <strong>Configuration issue:</strong> {message}
      </span>
      <button
        onClick={() => setShow(false)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: '#5E4B3C',
          lineHeight: 1,
          padding: '0 4px',
        }}
      >
        ×
      </button>
    </div>
  );
}
