'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Link2,
  Users,
  TrendingUp,
  BookOpen,
  ExternalLink,
  Sparkles,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { providerService } from '@/lib/services/providerService';
import { defaultCopingStrategies } from '@/lib/data/copingStrategies';
import type { ProviderLink } from '@/lib/types/provider';

/**
 * Error message component that uses useSearchParams
 * Wrapped in Suspense to avoid prerendering issues
 */
function ErrorMessageDisplay() {
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (error === 'cannot_access_patient_link_in_provider_mode') {
      setErrorMessage(
        'Cannot access patient onboarding links while in provider mode. Please exit provider mode to use patient features.'
      );
    } else if (error === 'provider_cannot_access_patient_routes') {
      setErrorMessage(
        'Provider accounts cannot access patient routes. Please use the provider portal instead.'
      );
    }
  }, [error]);

  if (!errorMessage) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>
      <button
        onClick={() => setErrorMessage(null)}
        className="text-destructive hover:text-destructive/80"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Provider Dashboard
 *
 * Main landing page for providers after login.
 * Displays authenticated provider information and real-time statistics
 * from the database including active links and patient counts.
 */
export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [linkStats, setLinkStats] = React.useState({
    activeLinks: 0,
    totalPatients: 0,
    totalLinks: 0,
  });
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [strategyCount, setStrategyCount] = React.useState(0);
  const [recentLinks, setRecentLinks] = React.useState<ProviderLink[]>([]);

  // Load link statistics and recent links
  React.useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        const stats = await providerService.getLinkStats(user.id);
        setLinkStats(stats);

        // Load recent links (top 5)
        const links = await providerService.getActiveLinks(user.id);
        setRecentLinks(links.slice(0, 5));
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  // Load strategy count from default strategies
  React.useEffect(() => {
    setStrategyCount(defaultCopingStrategies.length);
  }, []);

  // Statistics cards with real data
  const stats = [
    {
      title: 'Active Links',
      value: statsLoading ? '...' : linkStats.activeLinks.toString(),
      description: 'Patient onboarding links',
      icon: Link2,
      color: 'text-clear-sky',
      bgColor: 'bg-[#489FDF]/10 dark:bg-[#489FDF]/20',
    },
    {
      title: 'Patients',
      value: statsLoading ? '...' : linkStats.totalPatients.toString(),
      description: 'Using your plans',
      icon: Users,
      color: 'text-green-zone',
      bgColor: 'bg-[#154734]/10 dark:bg-[#154734]/20',
    },
    {
      title: 'Strategies',
      value: strategyCount > 0 ? strategyCount.toString() : '...',
      description: 'Available in library',
      icon: Sparkles,
      color: 'text-uvm-gold',
      bgColor: 'bg-[#FFD100]/10 dark:bg-[#FFD100]/20',
    },
  ];

  const gettingStarted = [
    {
      step: 1,
      title: 'Generate Your First Link',
      description: 'Create a personalized onboarding link to share with patients',
      action: 'Get Started',
      href: '/provider/link-generator',
    },
    {
      step: 2,
      title: 'Share with Patients',
      description: 'Send the link via email, text, or print the QR code',
    },
    {
      step: 3,
      title: 'Patients Complete Onboarding',
      description: 'They create their well-being plan on their device',
    },
  ];

  const resources = [
    {
      title: 'Documentation',
      description: 'Learn about the Well-Being Action Plan approach',
      icon: BookOpen,
      href: 'https://github.com/Turnstone-Tech-LLC/well-being-action-plan',
    },
    {
      title: 'Provider Links Guide',
      description: 'How to create and share patient onboarding links',
      icon: FileText,
      href: 'https://github.com/Turnstone-Tech-LLC/well-being-action-plan/blob/main/docs/PROVIDER_LINKS.md',
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium text-muted-foreground">
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-catamount-green dark:text-[#7FD4B8]">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-2 text-lg text-vermont-slate dark:text-[#A8D5FF]">
          {profile?.organization
            ? `${profile.organization} - Provider Portal`
            : 'Create personalized well-being action plans for your patients'}
        </p>
      </div>

      {/* Error Message */}
      <Suspense fallback={null}>
        <ErrorMessageDisplay />
      </Suspense>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Getting Started Guide - Conditional Display */}
      {linkStats.activeLinks === 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>Follow these steps to start helping your patients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gettingStarted.map((item) => (
              <div key={item.step} className="flex gap-4">
                {/* Step number */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.action && item.href && (
                    <Button
                      onClick={() => router.push(item.href)}
                      size="sm"
                      className="mt-2"
                      variant="outline"
                    >
                      {item.action}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Links - Conditional Display */}
      {recentLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Links</CardTitle>
            <CardDescription>Your most recently created patient onboarding links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLinks.map((link) => {
                const createdDate = new Date(link.created_at);
                const patientCount = link.metadata?.patientCount || 0;

                return (
                  <div
                    key={link.id}
                    className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{link.slug}</p>
                        {link.is_active ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {createdDate.toLocaleDateString()} • {patientCount} patient
                        {patientCount !== 1 ? 's' : ''}
                      </p>
                      {link.link_config.customMessage && (
                        <p className="text-xs text-muted-foreground">
                          "{link.link_config.customMessage.substring(0, 60)}
                          {link.link_config.customMessage.length > 60 ? '...' : ''}"
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => router.push(`/provider/links/${link.id}`)}
                      variant="ghost"
                      size="sm"
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Resources</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card
                key={resource.title}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => window.open(resource.href, '_blank')}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="text-base">Privacy & Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Patient data stays private on their devices.</strong> The Well-Being Action Plan
            uses a local-first architecture where all patient information is stored only on their
            device using IndexedDB.
          </p>
          <p className="text-xs text-muted-foreground">
            Provider links contain only your contact information and recommended strategies — no
            patient data is transmitted or stored on our servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
