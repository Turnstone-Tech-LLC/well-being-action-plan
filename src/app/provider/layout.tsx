import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Provider Portal - Well-Being Action Plan',
  description: 'Generate shareable links for patient well-being action plans',
};

/**
 * Provider Portal Layout
 *
 * Root layout for all provider portal pages.
 * Future: Will include authentication checks and provider navigation.
 */
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Provider Portal</h1>
              <p className="text-xs text-muted-foreground">Well-Being Action Plan</p>
            </div>
          </div>
          {/* Future: Add provider profile menu here */}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white/50 py-4 text-center text-xs text-muted-foreground dark:bg-gray-900/50">
        <p>
          Patient data is never stored on our servers. All well-being plans remain private on
          patient devices.
        </p>
      </footer>
    </div>
  );
}
