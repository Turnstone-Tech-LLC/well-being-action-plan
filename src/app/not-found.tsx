import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '16px',
      }}
    >
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
        404 - Page Not Found
      </h2>
      <p style={{ marginTop: '8px', color: '#4b5563' }}>
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '16px',
          color: '#3b82f6',
          textDecoration: 'none',
        }}
      >
        Go back home
      </Link>
    </div>
  );
}
