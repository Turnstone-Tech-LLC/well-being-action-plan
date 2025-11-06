'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZoneType } from '@/lib/types/zone';
import { CopingStrategy } from '@/lib/types/coping-strategy';
import { createCheckIn, getAllCopingStrategies } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Yellow Zone Check-In Screen
 *
 * Check-in interface for patients in the Yellow (struggling) zone.
 * Features coping strategy suggestions tailored to their situation.
 *
 * Features:
 * - Prominent "Yellow Zone" indicator
 * - Display 3-5 relevant coping strategies from patient's saved list
 * - Interactive strategy cards that expand on tap
 * - "Try This Strategy" action button for each strategy
 * - "Save Check-In" button that persists data to IndexedDB
 * - Encouraging, supportive messaging
 * - Tracks user engagement with strategies (views and usage)
 */
export default function YellowZoneCheckIn() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<CopingStrategy[]>([]);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [triedStrategies, setTriedStrategies] = useState<Set<string>>(new Set());
  const [viewedStrategies, setViewedStrategies] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      // Get all coping strategies from the database
      const allStrategies = await getAllCopingStrategies();

      // Prioritize favorites, then randomize the rest
      const favorites = allStrategies.filter((s) => s.isFavorite);
      const others = allStrategies.filter((s) => !s.isFavorite);

      // Shuffle the non-favorites
      const shuffledOthers = others.sort(() => Math.random() - 0.5);

      // Combine favorites first, then others, and take 3-5
      const combined = [...favorites, ...shuffledOthers];
      const selectedStrategies = combined.slice(0, Math.min(5, combined.length));

      setStrategies(selectedStrategies);
    } catch (error) {
      console.error('Failed to load coping strategies:', error);
      // In production, show error message to user
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategyExpansion = (strategyId: string) => {
    if (expandedStrategyId === strategyId) {
      setExpandedStrategyId(null);
    } else {
      setExpandedStrategyId(strategyId);
      // Track that user viewed this strategy
      setViewedStrategies((prev) => new Set(prev).add(strategyId));
    }
  };

  const handleTryStrategy = (strategyId: string) => {
    setTriedStrategies((prev) => new Set(prev).add(strategyId));
    // In production, you might want to track this engagement in analytics
  };

  const handleSaveCheckIn = async () => {
    setSaving(true);

    try {
      // Create check-in entry with engaged strategies
      await createCheckIn({
        userId: 'default-user', // TODO: Replace with actual user ID from auth
        zone: ZoneType.Yellow,
        copingStrategyIds: Array.from(triedStrategies),
        notes: `Viewed ${viewedStrategies.size} strategies, tried ${triedStrategies.size}`,
      });

      setSaved(true);

      // Navigate back to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to save check-in:', error);
      // In production, show error message to user
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/check-in');
  };

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Check className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              Check-In Saved!
            </h2>
            <p className="text-yellow-600 dark:text-yellow-400">
              You&apos;re taking important steps. Remember, reaching out for support is a sign of
              strength.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back to zone selection"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Yellow Zone Indicator */}
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                <AlertTriangle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mb-2 flex justify-center">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Yellow Zone
              </Badge>
            </div>
            <CardTitle className="text-3xl text-yellow-700 dark:text-yellow-300">
              You&apos;re Not Alone 🤝
            </CardTitle>
            <CardDescription className="text-lg text-yellow-600 dark:text-yellow-400">
              It&apos;s okay to struggle. Let&apos;s explore some strategies that might help you
              feel better.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Coping Strategies */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-xl">Coping Strategies for You</CardTitle>
            </div>
            <CardDescription>
              {strategies.length > 0
                ? 'Tap a strategy to learn more, or try one that resonates with you'
                : 'Loading your strategies...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
              </div>
            ) : strategies.length > 0 ? (
              strategies.map((strategy) => {
                const isExpanded = expandedStrategyId === strategy.id;
                const hasTried = triedStrategies.has(strategy.id);

                return (
                  <Card
                    key={strategy.id}
                    className={cn(
                      'transition-all duration-200',
                      isExpanded && 'ring-2 ring-yellow-500',
                      hasTried && 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <button
                        onClick={() => toggleStrategyExpansion(strategy.id)}
                        className="flex w-full items-start justify-between gap-2 text-left"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-base">
                            {strategy.title}
                            {hasTried && (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </CardTitle>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {strategy.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </button>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-3 pt-0">
                        <CardDescription className="leading-relaxed">
                          {strategy.description}
                        </CardDescription>
                        {!hasTried && (
                          <Button
                            onClick={() => handleTryStrategy(strategy.id)}
                            variant="outline"
                            className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-300 dark:hover:bg-yellow-950"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Try This Strategy
                          </Button>
                        )}
                        {hasTried && (
                          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                            <Check className="h-4 w-4" />
                            <span>Great job trying this strategy!</span>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="rounded-lg bg-muted p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No coping strategies found. Complete the onboarding process to add strategies to
                  your plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Encouragement */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              Remember: It&apos;s okay to not be okay. Taking time to check in and explore coping
              strategies is a positive step toward feeling better.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSaveCheckIn}
            disabled={saving}
            size="lg"
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600"
          >
            {saving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Save Check-In
              </>
            )}
          </Button>
          <Button onClick={handleBack} variant="outline" size="lg" className="sm:w-32">
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}
