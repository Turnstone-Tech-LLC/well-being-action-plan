'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #f5f9ff, #fff)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '16px',
      }}
    >
      <div style={{ maxWidth: '448px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px',
            }}
          >
            Something went wrong!
          </h1>
          <p style={{ color: '#4b5563', marginTop: '8px' }}>
            An unexpected error occurred. Please try again.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
