'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Flame,
  Calendar,
  Phone,
  User,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Settings,
  TrendingUp,
  Info,
} from 'lucide-react';
import { getUserConfig, getCheckInsByUser, getAllCopingStrategies } from '@/lib/db';
import { getUserIdentity } from '@/lib/services/userIdentityService';
import { getZoneColors, getZoneLabel } from '@/lib/utils/zoneUtils';
import type { ProviderLinkConfig } from '@/lib/types';
import type { CheckIn } from '@/lib/types/check-in';
import type { CopingStrategy } from '@/lib/types/coping-strategy';
import { initializeNotificationScheduling } from '@/lib/services/notificationService';
import { usePatientAuth } from '@/hooks/usePatientAuth';

/**
 * Session Message Component
 * Separated to use useSearchParams() with Suspense boundary
 */
function SessionMessage() {
  const searchParams = useSearchParams();
  const [showSessionMessage, setShowSessionMessage] = useState(false);

  useEffect(() => {
    // Check for session message in URL params
    const message = searchParams.get('message');
    if (message === 'session_exists') {
      // Use setTimeout to avoid setState directly in effect
      const immediateTimer = setTimeout(() => {
        setShowSessionMessage(true);
      }, 0);

      // Clear the message from URL after 5 seconds
      const timer = setTimeout(() => {
        setShowSessionMessage(false);
        // Remove the message param from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url.toString());
      }, 5000);

      return () => {
        clearTimeout(immediateTimer);
        clearTimeout(timer);
      };
    }
  }, [searchParams]);

  if (!showSessionMessage) {
    return null;
  }

  return (
    <Alert
      className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
      role="status"
      aria-live="polite"
    >
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        You already have an active session. Your existing well-being plan is loaded below.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Patient Dashboard / Home Screen
 *
 * Main landing screen after onboarding showing:
 * - Personalized welcome
 * - Daily check-in CTA
 * - Today's check-ins
 * - Check-in streak
 * - Provider information
 * - Coping strategies
 * - Crisis resources
 * - Navigation to history and settings
 *
 * Protected Route: Requires completed onboarding
 */
export default function DashboardPage() {
  const router = useRouter();
  // Patient authentication - redirects to onboarding if not complete
  const { loading: authLoading, isOnboardingComplete } = usePatientAuth();
  const [loading, setLoading] = useState(true);
  const [_userId, setUserId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [providerConfig, setProviderConfig] = useState<ProviderLinkConfig | null>(null);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [copingStrategies, setCopingStrategies] = useState<CopingStrategy[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate consecutive days of check-ins
   */
  const calculateStreak = async (currentUserId: string): Promise<number> => {
    try {
      // Get all check-ins sorted by date
      const allCheckIns = await getCheckInsByUser(currentUserId, { limit: 365 });

      if (allCheckIns.length === 0) return 0;

      // Group check-ins by date
      const checkInDates = new Set<string>();
      allCheckIns.forEach((checkIn) => {
        const date = new Date(checkIn.timestamp);
        date.setHours(0, 0, 0, 0);
        checkInDates.add(date.toDateString());
      });

      // Calculate streak from today backwards
      let streak = 0;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      while (checkInDates.has(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        // Get user identity
        const identity = await getUserIdentity();
        if (!isMounted) return;
        setUserId(identity.userId); // Store for future use

        // Load patient name from userConfig
        const nameConfig = await getUserConfig(identity.userId, 'preferredName');
        if (!isMounted) return;
        if (nameConfig && typeof nameConfig.value === 'string') {
          setPatientName(nameConfig.value);
        }

        // Load provider config from localStorage
        const providerConfigJson = localStorage.getItem('providerConfig');
        if (providerConfigJson && isMounted) {
          setProviderConfig(JSON.parse(providerConfigJson));
        }

        // Prepare date ranges for today's check-ins
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Load data in parallel for faster performance
        const [checkIns, streak, strategies] = await Promise.all([
          getCheckInsByUser(identity.userId, {
            startDate: today,
            endDate: tomorrow,
          }),
          calculateStreak(identity.userId),
          getAllCopingStrategies({ limit: 6 }),
        ]);

        if (!isMounted) return;
        setTodayCheckIns(checkIns);
        setCheckInStreak(streak);
        setCopingStrategies(strategies);

        // Initialize notification scheduling
        await initializeNotificationScheduling('patient');

        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
        setLoading(false);
      }
    };

    // Only load dashboard data if onboarding is complete
    if (!authLoading && isOnboardingComplete) {
      loadDashboardData();
    }

    return () => {
      isMounted = false;
    };
  }, [authLoading, isOnboardingComplete]);

  const handleCheckIn = () => {
    router.push('/check-in');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleViewSettings = () => {
    router.push('/settings');
  };

  // Show loading state while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div
            className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            {authLoading ? 'Checking authentication...' : 'Loading your dashboard...'}
          </p>
        </div>
      </main>
    );
  }

  // If onboarding is not complete, the usePatientAuth hook will redirect
  // This is a safety check in case the redirect hasn't happened yet
  if (!isOnboardingComplete) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-morning-fog to-[#F0F8FF] p-4 dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Error Message */}
        {error && (
          <Alert
            className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* UVM Branding Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-catamount-green">Well-Being Action Plan</h2>
          <p className="text-xs text-vermont-slate">
            Developed in collaboration with The University of Vermont Children&apos;s Hospital
          </p>
        </div>

        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-vermont-slate">
              Welcome back{patientName ? `, ${patientName}` : ''}!{' '}
              <span role="img" aria-label="waving hand">
                👋
              </span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewSettings}
            aria-label="Go to settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Session Exists Message */}
        <Suspense fallback={null}>
          <SessionMessage />
        </Suspense>

        {/* Check-in Streak Card */}
        {checkInStreak > 0 && (
          <Card
            className="border-uvm-gold bg-gradient-to-r from-[#FFD100]/10 to-[#FFD100]/5 dark:border-[#FFD100]/30 dark:from-[#FFD100]/15 dark:to-[#FFD100]/5"
            role="status"
            aria-live="polite"
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-full bg-[#FFD100]/20 p-3 dark:bg-[#FFD100]/30">
                <Flame className="h-6 w-6 text-[#B39D00] dark:text-[#FFE066]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Check-in Streak</p>
                <p className="text-2xl font-bold text-vermont-slate">
                  {checkInStreak} {checkInStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep it up!{' '}
                <span role="img" aria-label="celebration">
                  🎉
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Check-in CTA */}
        <Card className="border-primary shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How are you feeling today?</CardTitle>
            <CardDescription>
              Take a moment to check in with yourself and track your well-being
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={handleCheckIn} size="lg" className="px-8 py-6 text-lg">
              <Heart className="mr-2 h-5 w-5" />
              Check In Now
            </Button>
          </CardContent>
        </Card>

        {/* Today's Check-ins */}
        {todayCheckIns.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today&apos;s Check-ins</CardTitle>
                <Badge variant="secondary">{todayCheckIns.length}</Badge>
              </div>
              <CardDescription>Your emotional check-ins from today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getZoneColors(checkIn.zone)} variant="secondary">
                      {getZoneLabel(checkIn.zone, 'full')}
                    </Badge>
                    {checkIn.notes && (
                      <p className="text-sm text-muted-foreground">{checkIn.notes}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(checkIn.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Provider Information */}
          {providerConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Provider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{providerConfig.provider.name}</p>
                  {providerConfig.provider.organization && (
                    <p className="text-sm text-muted-foreground">
                      {providerConfig.provider.organization}
                    </p>
                  )}
                </div>

                {providerConfig.provider.contactInfo && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      {providerConfig.provider.contactInfo.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{providerConfig.provider.contactInfo.phone}</span>
                        </div>
                      )}
                      {providerConfig.provider.contactInfo.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span role="img" aria-label="email">
                            📧
                          </span>
                          <span>{providerConfig.provider.contactInfo.email}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Coping Strategies Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Your Coping Strategies
                </CardTitle>
                <Badge variant="secondary">{copingStrategies.length}</Badge>
              </div>
              <CardDescription>Quick access to your personalized strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {copingStrategies.slice(0, 4).map((strategy) => (
                <div key={strategy.id} className="rounded-lg border bg-muted/50 p-2 text-sm">
                  <p className="font-medium">{strategy.title}</p>
                </div>
              ))}
              {copingStrategies.length > 4 && (
                <p className="pt-2 text-xs text-muted-foreground">
                  +{copingStrategies.length - 4} more strategies available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="transition-all hover:shadow-lg">
            <button
              className="w-full rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={handleViewHistory}
              aria-label="View mood history and progress over time"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Mood History</p>
                    <p className="text-xs text-muted-foreground">View your progress over time</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </button>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <button
              className="w-full rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => router.push('/check-in')}
              aria-label="Start wellness check-in to track how you're feeling"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Wellness Check-in</p>
                    <p className="text-xs text-muted-foreground">Track how you&apos;re feeling</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </button>
          </Card>
        </div>

        {/* Crisis Resources */}
        <Card className="border-red-zone bg-[#DC582A]/5 dark:border-[#DC582A]/30 dark:bg-[#DC582A]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-zone dark:text-[#FF9B7F]">
              <AlertCircle className="h-5 w-5" />
              Crisis Resources
            </CardTitle>
            <CardDescription className="text-[#8B3D1F] dark:text-[#FFB399]">
              Help is always available when you need it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 border-red-zone bg-white hover:bg-[#DC582A]/5 dark:border-[#DC582A]/50 dark:bg-[#DC582A]/10"
                asChild
              >
                <a href="tel:988">
                  <Phone className="mr-2 h-4 w-4" />
                  Call 988 - Suicide & Crisis Lifeline
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-zone bg-white hover:bg-[#DC582A]/5 dark:border-[#DC582A]/50 dark:bg-[#DC582A]/10"
                asChild
              >
                <a href="sms:741741">
                  <span role="img" aria-label="SMS message" className="mr-2">
                    💬
                  </span>
                  Text HOME to 741741 - Crisis Text Line
                </a>
              </Button>
            </div>
            <p className="text-xs text-[#8B3D1F] dark:text-[#FFB399]">
              If you&apos;re in immediate danger, call 911 or go to your nearest emergency room.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="border-clear-sky bg-[#489FDF]/5 dark:border-[#489FDF]/30 dark:bg-[#489FDF]/10">
          <CardContent className="py-4 text-center text-sm text-vermont-slate dark:text-[#A8D5FF]">
            <span role="img" aria-label="locked">
              🔒
            </span>{' '}
            Your data is private and stored only on your device. We never share your information.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
