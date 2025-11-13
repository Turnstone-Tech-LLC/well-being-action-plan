'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { CopingStrategy, CopingStrategyCategory } from '@/lib/types/coping-strategy';
import { categoryConfig } from '@/lib/config/categoryConfig';
import { getStoredProviderConfig } from '@/lib/utils/linkHelpers';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

/**
 * Onboarding Step 2: Review and Select Coping Strategies
 *
 * This step allows patients to:
 * - Review coping strategies provided by their healthcare provider
 * - Toggle strategies on/off based on their preferences
 * - See strategies organized by category
 * - Navigate back to Step 1 or forward to Step 3
 */
export default function OnboardingStep2Page() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<CopingStrategy[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('your provider');

  // Load coping strategies from provider config
  useEffect(() => {
    try {
      const config = getStoredProviderConfig();

      if (!config) {
        setError('No provider configuration found. Please start from the beginning.');
        setLoading(false);
        return;
      }

      setProviderName(config.provider.name);

      // Get coping strategies from provider config
      const providedStrategies = config.copingStrategies || [];

      if (providedStrategies.length === 0) {
        // If no strategies provided, use default set
        const defaultStrategies: CopingStrategy[] = [
          {
            id: 'default-1',
            title: 'Deep Breathing',
            description:
              'Take slow, deep breaths for 5 minutes. Inhale for 4 counts, hold for 4, exhale for 6.',
            category: CopingStrategyCategory.Physical,
          },
          {
            id: 'default-2',
            title: 'Go for a Walk',
            description: 'Take a short walk outside to clear your mind and get some fresh air.',
            category: CopingStrategyCategory.Physical,
          },
          {
            id: 'default-3',
            title: 'Call a Friend',
            description:
              'Reach out to a trusted friend or family member for support and connection.',
            category: CopingStrategyCategory.Social,
          },
          {
            id: 'default-4',
            title: 'Talk to Someone',
            description: 'Share your feelings with someone you trust.',
            category: CopingStrategyCategory.Social,
          },
          {
            id: 'default-5',
            title: 'Journaling',
            description: 'Write down your thoughts and feelings in a journal to process emotions.',
            category: CopingStrategyCategory.Emotional,
          },
          {
            id: 'default-6',
            title: 'Name Your Emotions',
            description:
              'Identify and label what you are feeling to better understand your emotions.',
            category: CopingStrategyCategory.Emotional,
          },
          {
            id: 'default-7',
            title: 'Positive Affirmations',
            description:
              'Repeat positive statements to yourself to challenge negative thought patterns.',
            category: CopingStrategyCategory.Cognitive,
          },
          {
            id: 'default-8',
            title: 'Reframe Negative Thoughts',
            description:
              'Challenge negative thinking by finding alternative, more balanced perspectives.',
            category: CopingStrategyCategory.Cognitive,
          },
          {
            id: 'default-9',
            title: 'Listen to Music',
            description: 'Put on calming or uplifting music to shift your emotional state.',
            category: CopingStrategyCategory.Sensory,
          },
          {
            id: 'default-10',
            title: 'Use a Stress Ball',
            description: 'Squeeze a stress ball or hold something textured to ground yourself.',
            category: CopingStrategyCategory.Sensory,
          },
          {
            id: 'default-11',
            title: 'Creative Drawing',
            description: 'Express yourself through art, doodling, or coloring to release tension.',
            category: CopingStrategyCategory.Creative,
          },
          {
            id: 'default-12',
            title: 'Play an Instrument',
            description: 'Make music as a form of creative expression and emotional release.',
            category: CopingStrategyCategory.Creative,
          },
        ];
        setStrategies(defaultStrategies);
        // Pre-select all default strategies
        setSelectedIds(new Set(defaultStrategies.map((s) => s.id)));
      } else {
        setStrategies(providedStrategies);
        // Pre-select all provided strategies
        setSelectedIds(new Set(providedStrategies.map((s) => s.id)));
      }

      setLoading(false);
    } catch {
      setError('Failed to load coping strategies. Please try again.');
      setLoading(false);
    }
  }, []);

  /**
   * Toggle strategy selection
   */
  const handleToggleStrategy = (strategyId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId);
      } else {
        newSet.add(strategyId);
      }
      return newSet;
    });
  };

  /**
   * Navigate back to Step 1
   */
  const handleBack = () => {
    router.push('/onboarding');
  };

  /**
   * Save selections and navigate to Step 3
   */
  const handleNext = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate that at least one strategy is selected
      if (selectedIds.size === 0) {
        setError('Please select at least one coping strategy to continue.');
        setSaving(false);
        return;
      }

      // Store selected strategies in sessionStorage (don't write to IndexedDB yet)
      // This data will be saved to IndexedDB only when onboarding is completed in step 3
      const selectedIdsArray = Array.from(selectedIds);
      const selectedStrategies = strategies.filter((s) => selectedIds.has(s.id));

      sessionStorage.setItem(
        'onboarding_selectedCopingStrategyIds',
        JSON.stringify(selectedIdsArray)
      );
      sessionStorage.setItem(
        'onboarding_selectedCopingStrategies',
        JSON.stringify(selectedStrategies)
      );

      // Navigate to Step 3
      router.push('/onboarding/step-3');
    } catch {
      setError('Failed to save your selections. Please try again.');
      setSaving(false);
    }
  };

  /**
   * Group strategies by category
   */
  const strategiesByCategory = strategies.reduce(
    (acc, strategy) => {
      if (!acc[strategy.category]) {
        acc[strategy.category] = [];
      }
      acc[strategy.category].push(strategy);
      return acc;
    },
    {} as Record<CopingStrategyCategory, CopingStrategy[]>
  );

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading coping strategies...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Error state
  if (error && strategies.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <ProgressIndicator currentStep={2} totalSteps={3} />
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Error Loading Strategies</CardTitle>
              </div>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/')} variant="outline">
                Start Over
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-morning-fog to-[#F0F8FF] p-4 py-8 dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* UVM Branding Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-catamount-green">Well-Being Action Plan</h2>
          <p className="text-xs text-vermont-slate">
            Developed in collaboration with The University of Vermont Children's Hospital
          </p>
        </div>

        <ProgressIndicator currentStep={2} totalSteps={3} />

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Coping Strategies</CardTitle>
            <CardDescription>
              {providerName} has suggested these coping strategies for you. Select the ones that
              resonate with you - you can always change them later.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Selection count */}
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <span className="text-sm font-medium">
                {selectedIds.size} {selectedIds.size === 1 ? 'strategy' : 'strategies'} selected
              </span>
              <span className="text-xs text-muted-foreground">
                Tap strategies to select or deselect
              </span>
            </div>

            {/* Display strategies grouped by category */}
            <div className="space-y-6">
              {Object.entries(strategiesByCategory).map(([category, categoryStrategies]) => {
                const config = categoryConfig[category as CopingStrategyCategory];
                const Icon = config.icon;

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{config.label}</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryStrategies.length}
                      </Badge>
                    </div>

                    {/* Strategy cards */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {categoryStrategies.map((strategy) => {
                        const isSelected = selectedIds.has(strategy.id);

                        return (
                          <button
                            key={strategy.id}
                            onClick={() => handleToggleStrategy(strategy.id)}
                            className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-card hover:border-primary/50'
                            }`}
                          >
                            {/* Selection indicator */}
                            <div
                              className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground/30 bg-background group-hover:border-primary/50'
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="h-3 w-3 text-primary-foreground"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>

                            {/* Category badge */}
                            <Badge className={`mb-2 ${config.color}`}>{config.label}</Badge>

                            {/* Strategy content */}
                            <h4 className="mb-1 pr-8 font-semibold">{strategy.title}</h4>
                            <p className="text-sm text-muted-foreground">{strategy.description}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Separator between categories (except last) */}
                    {Object.keys(strategiesByCategory).indexOf(category) <
                      Object.keys(strategiesByCategory).length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={saving}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                size="lg"
                className="flex-1"
                disabled={saving || selectedIds.size === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
