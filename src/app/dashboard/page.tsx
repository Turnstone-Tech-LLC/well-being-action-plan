'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { getUserConfig, getCheckInsByUser, getAllCopingStrategies } from '@/lib/db';
import type { ProviderLinkConfig } from '@/lib/types';
import type { CheckIn } from '@/lib/types/check-in';
import type { CopingStrategy } from '@/lib/types/coping-strategy';
import { ZoneType } from '@/lib/types/zone';

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
 */
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState<string>('');
  const [providerConfig, setProviderConfig] = useState<ProviderLinkConfig | null>(null);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [copingStrategies, setCopingStrategies] = useState<CopingStrategy[]>([]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load patient name from userConfig
      const nameConfig = await getUserConfig('patient', 'preferredName');
      if (nameConfig && typeof nameConfig.value === 'string') {
        setPatientName(nameConfig.value);
      }

      // Load provider config from localStorage
      const providerConfigJson = localStorage.getItem('providerConfig');
      if (providerConfigJson) {
        setProviderConfig(JSON.parse(providerConfigJson));
      }

      // Load today's check-ins
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const checkIns = await getCheckInsByUser('default-user', {
        startDate: today,
        endDate: tomorrow,
      });
      setTodayCheckIns(checkIns);

      // Calculate check-in streak
      const streak = await calculateStreak();
      setCheckInStreak(streak);

      // Load coping strategies
      const strategies = await getAllCopingStrategies({ limit: 6 });
      setCopingStrategies(strategies);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  /**
   * Calculate consecutive days of check-ins
   */
  const calculateStreak = async (): Promise<number> => {
    try {
      // Get all check-ins sorted by date
      const allCheckIns = await getCheckInsByUser('default-user', { limit: 365 });

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

  const handleCheckIn = () => {
    router.push('/check-in');
  };

  const handleViewHistory = () => {
    // TODO: Navigate to mood history page when implemented (#47)
    // Placeholder until mood history is implemented
    router.push('/check-in');
  };

  const handleViewSettings = () => {
    // TODO: Navigate to settings page when implemented
    // Placeholder - settings not yet implemented
  };

  const getZoneColor = (zone: ZoneType) => {
    switch (zone) {
      case ZoneType.Green:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case ZoneType.Yellow:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case ZoneType.Red:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getZoneLabel = (zone: ZoneType) => {
    switch (zone) {
      case ZoneType.Green:
        return '✓ Green Zone';
      case ZoneType.Yellow:
        return '⚠ Yellow Zone';
      case ZoneType.Red:
        return '🆘 Red Zone';
      default:
        return zone;
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back{patientName ? `, ${patientName}` : ''}! 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleViewSettings}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Check-in Streak Card */}
        {checkInStreak > 0 && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-800 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Check-in Streak</p>
                <p className="text-2xl font-bold">
                  {checkInStreak} {checkInStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Keep it up! 🎉</p>
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
                    <Badge className={getZoneColor(checkIn.zone)} variant="secondary">
                      {getZoneLabel(checkIn.zone)}
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
                          <span>📧</span>
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
          <Card
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={handleViewHistory}
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
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={() => router.push('/check-in')}
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
          </Card>
        </div>

        {/* Crisis Resources */}
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              Crisis Resources
            </CardTitle>
            <CardDescription className="text-red-800 dark:text-red-300">
              Help is always available when you need it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 border-red-300 bg-white hover:bg-red-50 dark:border-red-700 dark:bg-red-950/50"
                asChild
              >
                <a href="tel:988">
                  <Phone className="mr-2 h-4 w-4" />
                  Call 988 - Suicide & Crisis Lifeline
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-300 bg-white hover:bg-red-50 dark:border-red-700 dark:bg-red-950/50"
                asChild
              >
                <a href="sms:741741">
                  <span className="mr-2">💬</span>
                  Text HOME to 741741 - Crisis Text Line
                </a>
              </Button>
            </div>
            <p className="text-xs text-red-700 dark:text-red-400">
              If you&apos;re in immediate danger, call 911 or go to your nearest emergency room.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            🔒 Your data is private and stored only on your device. We never share your information.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
