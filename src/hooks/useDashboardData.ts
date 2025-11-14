/**
 * Custom hook for loading dashboard data
 *
 * Centralizes all dashboard data fetching logic using the useAsyncData pattern
 */

import { useCallback, useMemo } from 'react';
import { getUserConfig, getCheckInsByUser, getAllCopingStrategies } from '@/lib/db';
import { getUserIdentity } from '@/lib/services/userIdentityService';
import { initializeNotificationScheduling } from '@/lib/services/notificationService';
import { useAsyncData } from './useAsyncData';
import type { ProviderLinkConfig } from '@/lib/types';
import type { CheckIn } from '@/lib/types/check-in';
import type { CopingStrategy } from '@/lib/types/coping-strategy';

export interface DashboardData {
  userId: string;
  patientName: string;
  providerConfig: ProviderLinkConfig | null;
  todayCheckIns: CheckIn[];
  checkInStreak: number;
  copingStrategies: CopingStrategy[];
}

/**
 * Calculate consecutive days of check-ins
 */
async function calculateStreak(userId: string): Promise<number> {
  try {
    // Get all check-ins sorted by date
    const allCheckIns = await getCheckInsByUser(userId, { limit: 365 });

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
}

/**
 * Load all dashboard data
 */
async function loadDashboardData(): Promise<DashboardData> {
  // Get user identity
  const identity = await getUserIdentity();
  const userId = identity.userId;

  // Load patient name from userConfig
  let patientName = '';
  const nameConfig = await getUserConfig(userId, 'preferredName');
  if (nameConfig && typeof nameConfig.value === 'string') {
    patientName = nameConfig.value;
  }

  // Load provider config from localStorage
  let providerConfig: ProviderLinkConfig | null = null;
  const providerConfigJson = localStorage.getItem('providerConfig');
  if (providerConfigJson) {
    try {
      providerConfig = JSON.parse(providerConfigJson);
    } catch (error) {
      console.error('Failed to parse provider config:', error);
    }
  }

  // Prepare date ranges for today's check-ins
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Load data in parallel for faster performance
  const [checkIns, streak, strategies] = await Promise.all([
    getCheckInsByUser(userId, {
      startDate: today,
      endDate: tomorrow,
    }),
    calculateStreak(userId),
    getAllCopingStrategies({ limit: 6 }),
  ]);

  // Initialize notification scheduling
  await initializeNotificationScheduling('patient');

  return {
    userId,
    patientName,
    providerConfig,
    todayCheckIns: checkIns,
    checkInStreak: streak,
    copingStrategies: strategies,
  };
}

/**
 * Custom hook for dashboard data
 */
export function useDashboardData(isEnabled: boolean) {
  // Memoized fetcher to prevent unnecessary re-renders
  const fetcher = useCallback(() => loadDashboardData(), []);

  // Use the async data hook with proper dependencies
  const { data, loading, error, refetch } = useAsyncData(fetcher, {
    immediate: isEnabled,
    dependencies: [isEnabled],
    onError: (err) => {
      console.error('Failed to load dashboard data:', err);
    },
  });

  // Extract individual data pieces with defaults
  const dashboardData = useMemo(
    () => ({
      userId: data?.userId || null,
      patientName: data?.patientName || '',
      providerConfig: data?.providerConfig || null,
      todayCheckIns: data?.todayCheckIns || [],
      checkInStreak: data?.checkInStreak || 0,
      copingStrategies: data?.copingStrategies || [],
    }),
    [data]
  );

  return {
    ...dashboardData,
    loading,
    error,
    refetch,
  };
}
