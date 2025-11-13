'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, Link2, User, LogOut, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';
import { useProviderMode } from '@/hooks/useProviderMode';

/**
 * Provider Portal Layout
 *
 * Root layout for all provider portal pages.
 * Includes authentication context and provider navigation.
 */
function ProviderLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isProviderMode, revokeProviderMode } = useProviderMode({ redirectIfDisabled: false });

  // Don't show nav on auth pages
  const isAuthPage = pathname?.startsWith('/provider/auth');

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

            {/* User Menu */}
            {user && profile && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <User className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{profile.name}</div>
                    {profile.organization && (
                      <div className="text-xs text-muted-foreground">{profile.organization}</div>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />

                    {/* Menu */}
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border bg-white shadow-lg dark:bg-gray-800">
                      <div className="border-b px-4 py-3">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push('/provider/settings');
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                        <button
                          onClick={async () => {
                            await signOut();
                            router.push('/provider/auth/login');
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                        {isProviderMode && (
                          <button
                            onClick={async () => {
                              setUserMenuOpen(false);
                              // Sign out the provider first, then revoke provider mode
                              await signOut();
                              revokeProviderMode();
                            }}
                            className="flex w-full items-center gap-2 border-t px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Shield className="h-4 w-4" />
                            Leave Provider Mode
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation - Only show on authenticated pages */}
          {!isAuthPage && (
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
          )}
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

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProviderLayoutInner>{children}</ProviderLayoutInner>
    </AuthProvider>
  );
}
