'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Provider Portal Layout
 *
 * Root layout for all provider portal pages.
 * Future: Will include authentication checks and provider navigation.
 */
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/provider',
      icon: LayoutDashboard,
    },
    {
      label: 'Link Generator',
      href: '/provider/link-generator',
      icon: Link2,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link
              href="/provider"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Provider Portal</h1>
                <p className="text-xs text-muted-foreground">Well-Being Action Plan</p>
              </div>
            </Link>

            {/* Future: Add provider profile menu here */}
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 border-t pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-primary dark:bg-gray-800'
                      : 'text-muted-foreground hover:bg-white/50 hover:text-foreground dark:hover:bg-gray-800/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
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
