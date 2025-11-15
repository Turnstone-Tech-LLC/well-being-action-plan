import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline - Well-Being Action Plan',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-12 w-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">You&apos;re Offline</h1>
          <p className="text-gray-600">It looks like you&apos;ve lost your internet connection.</p>
        </div>

        {/* What Works Offline */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">What still works offline:</h2>
          <ul className="space-y-3 text-left text-gray-700">
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>View your well-being action plan</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Complete emotional check-ins</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Access your coping strategies</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Review your check-in history</span>
            </li>
          </ul>
        </div>

        {/* Crisis Resources */}
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-900">
            Crisis Resources (Always Available)
          </h2>
          <div className="space-y-2 text-left">
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="font-semibold text-gray-900">988 Suicide & Crisis Lifeline</p>
              <a
                href="tel:988"
                className="text-blue-600 hover:underline"
                aria-label="Call 988 Suicide and Crisis Lifeline - Free, confidential support 24/7"
              >
                Call or text 988
              </a>
            </div>
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="font-semibold text-gray-900">Crisis Text Line</p>
              <a
                href="sms:741741"
                className="text-blue-600 hover:underline"
                aria-label="Text 741741 Crisis Text Line - Free, confidential support 24/7"
              >
                Text HOME to 741741
              </a>
            </div>
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="font-semibold text-gray-900">Emergency Services</p>
              <a href="tel:911" className="text-blue-600 hover:underline">
                Call 911
              </a>
            </div>
          </div>
        </div>

        {/* Return Home */}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Your data is saved locally on your device. Once you&apos;re back online, everything will
          sync automatically.
        </p>
      </div>
    </div>
  );
}
