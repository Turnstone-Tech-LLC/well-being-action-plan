'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <svg
            className="h-16 w-16 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">You&apos;re Offline</h1>

        <p className="mb-6 text-center text-gray-600">
          It looks like you&apos;re not connected to the internet. Don&apos;t worry, you can still
          access previously viewed pages.
        </p>

        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <h2 className="mb-2 font-semibold text-blue-900">What you can do:</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
              <li>View previously loaded pages</li>
              <li>Access your cached well-being action plan</li>
              <li>Review coping strategies you&apos;ve viewed before</li>
            </ul>
          </div>

          <button
            onClick={() => window.history.back()}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go Back
          </button>

          <a
            href="/"
            className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Home
          </a>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          You&apos;ll be back online automatically when your connection is restored.
        </div>
      </div>
    </div>
  );
}
