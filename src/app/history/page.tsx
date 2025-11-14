'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { getCheckInsByUser } from '@/lib/db';
import { CheckIn } from '@/lib/types/check-in';
import { ZoneType } from '@/lib/types/zone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePatientAuth } from '@/hooks/usePatientAuth';

interface DayCheckIns {
  date: Date;
  checkIns: CheckIn[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  checkIns: CheckIn[];
}

// Zone color mappings for calendar display - UVM Brand Colors
const zoneColors: Record<ZoneType, { bg: string; border: string; text: string }> = {
  [ZoneType.Green]: {
    bg: 'bg-[#154734]/10 dark:bg-[#154734]/30',
    border: 'border-green-zone',
    text: 'text-green-zone dark:text-[#7FD4B8]',
  },
  [ZoneType.Yellow]: {
    bg: 'bg-[#FFD100]/10 dark:bg-[#FFD100]/20',
    border: 'border-yellow-zone',
    text: 'text-[#B39D00] dark:text-[#FFE066]',
  },
  [ZoneType.Red]: {
    bg: 'bg-[#DC582A]/10 dark:bg-[#DC582A]/30',
    border: 'border-red-zone',
    text: 'text-red-zone dark:text-[#FF9B7F]',
  },
};

/**
 * Mood History Page
 *
 * Protected Route: Requires completed onboarding
 */
export default function MoodHistoryPage() {
  const router = useRouter();
  // Patient authentication - redirects to onboarding if not complete
  const { loading: authLoading, isOnboardingComplete } = usePatientAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayCheckIns | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch check-ins for the current month
  useEffect(() => {
    const fetchCheckIns = async () => {
      // Only fetch if onboarding is complete
      if (!authLoading && isOnboardingComplete) {
        setLoading(true);
        try {
          const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          const endDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0,
            23,
            59,
            59
          );

          const data = await getCheckInsByUser('default-user', {
            startDate,
            endDate,
          });

          setCheckIns(data);
        } catch (error) {
          console.error('Error fetching check-ins:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCheckIns();
  }, [currentMonth, authLoading, isOnboardingComplete]);

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Add previous month's days to fill the first week
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        checkIns: [],
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayCheckIns = checkIns.filter((checkIn) => {
        const checkInDate = new Date(checkIn.timestamp);
        return (
          checkInDate.getDate() === day &&
          checkInDate.getMonth() === month &&
          checkInDate.getFullYear() === year
        );
      });

      days.push({
        date,
        isCurrentMonth: true,
        checkIns: dayCheckIns,
      });
    }

    // Add next month's days to fill the last week
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        checkIns: [],
      });
    }

    return days;
  }, [currentMonth, checkIns]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(null);
  };

  // Handle day click
  const handleDayClick = (day: CalendarDay) => {
    if (day.checkIns.length > 0) {
      setSelectedDay({
        date: day.date,
        checkIns: day.checkIns,
      });
    } else {
      setSelectedDay(null);
    }
  };

  // Get the dominant zone for a day (if multiple check-ins)
  const getDominantZone = (checkIns: CheckIn[]): ZoneType | null => {
    if (checkIns.length === 0) return null;

    // Priority: Red > Yellow > Green (worst mood takes precedence)
    if (checkIns.some((c) => c.zone === ZoneType.Red)) return ZoneType.Red;
    if (checkIns.some((c) => c.zone === ZoneType.Yellow)) return ZoneType.Yellow;
    return ZoneType.Green;
  };

  // Get all unique zones for a day (for multiple check-ins indicator)
  const getUniqueZones = (checkIns: CheckIn[]): ZoneType[] => {
    const zones = new Set(checkIns.map((c) => c.zone));
    return Array.from(zones);
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If onboarding is not complete, the usePatientAuth hook will redirect
  if (!isOnboardingComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mood History</h1>
              <p className="text-muted-foreground">View your emotional well-being journey</p>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{monthName}</CardTitle>
                <CardDescription>Click on any day to view check-in details</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-semibold text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {calendarDays.map((day, index) => {
                    const dominantZone = getDominantZone(day.checkIns);
                    const uniqueZones = getUniqueZones(day.checkIns);
                    const hasMultipleCheckIns = day.checkIns.length > 1;

                    return (
                      <button
                        key={index}
                        onClick={() => handleDayClick(day)}
                        disabled={!day.isCurrentMonth || day.checkIns.length === 0}
                        className={cn(
                          'relative aspect-square min-h-[60px] rounded-lg border-2 p-2 transition-all',
                          'flex flex-col items-center justify-center',
                          'disabled:cursor-default',
                          // Base styles
                          day.isCurrentMonth
                            ? 'border-border bg-card hover:bg-accent'
                            : 'border-transparent bg-muted/30 text-muted-foreground',
                          // Today highlight
                          isToday(day.date) && 'ring-2 ring-primary ring-offset-2',
                          // Zone colors
                          dominantZone &&
                            day.isCurrentMonth && [
                              zoneColors[dominantZone].bg,
                              zoneColors[dominantZone].border,
                              'hover:opacity-90',
                            ],
                          // Selected state
                          selectedDay?.date.getTime() === day.date.getTime() &&
                            'ring-2 ring-primary ring-offset-2'
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-medium',
                            !day.isCurrentMonth && 'text-muted-foreground/50',
                            dominantZone && day.isCurrentMonth && zoneColors[dominantZone].text
                          )}
                        >
                          {day.date.getDate()}
                        </span>

                        {/* Multiple check-ins indicator */}
                        {hasMultipleCheckIns && day.isCurrentMonth && (
                          <div className="mt-1 flex gap-0.5">
                            {uniqueZones.map((zone, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  zone === ZoneType.Green && 'bg-green-600 dark:bg-green-400',
                                  zone === ZoneType.Yellow && 'bg-yellow-600 dark:bg-yellow-400',
                                  zone === ZoneType.Red && 'bg-red-600 dark:bg-red-400'
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 border-t pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900" />
                    <span>Green Zone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900" />
                    <span>Yellow Zone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-red-500 bg-red-100 dark:bg-red-900" />
                    <span>Red Zone</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        {selectedDay && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDay.date.toLocaleDateString('default', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
              <CardDescription>
                {selectedDay.checkIns.length} check-in{selectedDay.checkIns.length !== 1 ? 's' : ''}{' '}
                on this day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDay.checkIns
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className={cn(
                        'rounded-lg border-2 p-4',
                        zoneColors[checkIn.zone].bg,
                        zoneColors[checkIn.zone].border
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs font-semibold uppercase',
                                zoneColors[checkIn.zone].text
                              )}
                            >
                              {checkIn.zone} Zone
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(checkIn.timestamp).toLocaleTimeString('default', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {checkIn.moodRating && (
                            <div className="text-sm">
                              <span className="font-medium">Mood Rating:</span>{' '}
                              <span className={zoneColors[checkIn.zone].text}>
                                {checkIn.moodRating}/10
                              </span>
                            </div>
                          )}

                          {checkIn.notes && (
                            <div className="text-sm">
                              <span className="font-medium">Notes:</span>
                              <p className="mt-1 text-muted-foreground">{checkIn.notes}</p>
                            </div>
                          )}

                          {checkIn.triggerIds && checkIn.triggerIds.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">
                                Triggers: {checkIn.triggerIds.length}
                              </span>
                            </div>
                          )}

                          {checkIn.copingStrategyIds && checkIn.copingStrategyIds.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">
                                Coping Strategies Used: {checkIn.copingStrategyIds.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && checkIns.length === 0 && (
          <Card>
            <CardContent className="flex h-48 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No check-ins for {monthName}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Start tracking your mood to see your history here
              </p>
              <Button className="mt-4" onClick={() => router.push('/check-in')}>
                Start Check-In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
