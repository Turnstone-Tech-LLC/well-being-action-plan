'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/contexts/AuthContext';
import { actionPlanService } from '@/lib/services/actionPlanService';
import { defaultCopingStrategies, categoryGroups } from '@/lib/data/copingStrategies';
import { CopingStrategyCategory } from '@/lib/types/coping-strategy';
import { categoryConfig } from '@/lib/config/categoryConfig';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Plus, X, Eye } from 'lucide-react';

interface CustomStrategy {
  title: string;
  description: string;
}

/**
 * Plan Builder - Step 2: Coping Strategy Selection
 *
 * This step allows providers to:
 * - Select from 20 evidence-based coping strategies
 * - Add 1-2 custom strategies
 * - Preview selected strategies
 * - Validate minimum 3 strategies before proceeding
 */
function PlanBuilderStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get plan ID from URL params or sessionStorage
  const planIdFromUrl = searchParams.get('planId');
  const [planId, setPlanId] = useState<string | null>(planIdFromUrl);

  // Strategy selection state
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [customStrategies, setCustomStrategies] = useState<CustomStrategy[]>([
    { title: '', description: '' },
  ]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load plan ID and validate
  useEffect(() => {
    const storedPlanId = sessionStorage.getItem('currentPlanId');

    if (planIdFromUrl) {
      sessionStorage.setItem('currentPlanId', planIdFromUrl);
      setPlanId(planIdFromUrl);
      setLoading(false);
    } else if (storedPlanId) {
      setPlanId(storedPlanId);
      setLoading(false);
    } else {
      setError('No action plan found. Please start from step 1.');
      setLoading(false);
    }
  }, [planIdFromUrl]);

  /**
   * Toggle strategy selection by index
   */
  const handleToggleStrategy = (index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  /**
   * Add a new custom strategy field
   */
  const handleAddCustomStrategy = () => {
    if (customStrategies.length < 2) {
      setCustomStrategies([...customStrategies, { title: '', description: '' }]);
    }
  };

  /**
   * Remove a custom strategy field
   */
  const handleRemoveCustomStrategy = (index: number) => {
    setCustomStrategies(customStrategies.filter((_, i) => i !== index));
  };

  /**
   * Update custom strategy field
   */
  const handleCustomStrategyChange = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const updated = [...customStrategies];
    if (updated[index]) {
      updated[index][field] = value;
      setCustomStrategies(updated);
    }
  };

  /**
   * Get all selected strategies including custom ones
   */
  const getSelectedStrategies = () => {
    const selected = Array.from(selectedIndices)
      .map((index) => defaultCopingStrategies[index])
      .filter((strategy) => strategy !== undefined);
    const validCustom = customStrategies.filter(
      (custom) => custom.title.trim() !== '' && custom.description.trim() !== ''
    );
    return [...selected, ...validCustom];
  };

  /**
   * Navigate back to Step 1
   */
  const handleBack = () => {
    if (planId) {
      router.push(`/provider/plan/new?planId=${planId}`);
    } else {
      router.push('/provider/plan/new');
    }
  };

  /**
   * Save selections and navigate to next step
   */
  const handleNext = async () => {
    try {
      setSaving(true);
      setError(null);

      const allSelected = getSelectedStrategies();

      // Validate minimum 3 strategies
      if (allSelected.length < 3) {
        setError('Please select at least 3 coping strategies to continue.');
        setSaving(false);
        return;
      }

      // Validate user is authenticated
      if (!user) {
        setError('You must be signed in to create action plans');
        setSaving(false);
        return;
      }

      // Validate plan ID exists
      if (!planId) {
        setError('No action plan found. Please start from step 1.');
        setSaving(false);
        return;
      }

      // For now, we'll store the strategy data as JSON in copingStrategyIds
      // In a production app, you'd want to create these strategies in the database
      // and store their IDs. For this MVP, we'll serialize the strategy objects.
      const strategyIds = allSelected.map((_, index) => `strategy-${Date.now()}-${index}`);

      // Store the full strategy data in sessionStorage for now
      sessionStorage.setItem('planStrategies', JSON.stringify(allSelected));

      // Update the action plan with strategy IDs
      await actionPlanService.updateActionPlan({
        id: planId,
        copingStrategyIds: strategyIds,
      });

      // Clear sessionStorage
      sessionStorage.removeItem('currentPlanId');
      sessionStorage.removeItem('planStrategies');

      // Navigate to provider dashboard with success message
      router.push(`/provider?planCreated=${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coping strategies');
      setSaving(false);
    }
  };

  // Group strategies by the four main categories
  const groupedStrategies = Object.entries(categoryGroups).map(([groupKey, groupConfig]) => {
    const strategies = defaultCopingStrategies.filter((strategy) =>
      groupConfig.categories.includes(strategy.category)
    );
    return {
      key: groupKey,
      ...groupConfig,
      strategies,
    };
  });

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Error state (no plan ID)
  if (error && !planId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-3xl border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/provider/plan/new')} variant="outline">
              Return to Step 1
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const selectedStrategies = getSelectedStrategies();
  const totalSelected = selectedStrategies.length;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 py-8 md:p-8">
      <div className="w-full max-w-5xl space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-2 w-2 rounded-full bg-primary" />
          <div className="flex h-2 w-2 rounded-full bg-primary" />
          <div className="flex h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <p className="text-center text-xs text-muted-foreground">Step 2 of 3: Select Strategies</p>

        <Card>
          <CardHeader>
            <CardTitle>Select Coping Strategies</CardTitle>
            <CardDescription>
              Choose evidence-based strategies to include in your action plan. Select at least 3
              strategies, and feel free to add custom ones that work for your patients.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Selection count and preview toggle */}
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {totalSelected} {totalSelected === 1 ? 'strategy' : 'strategies'} selected
                </span>
                {totalSelected < 3 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:text-amber-400"
                  >
                    Minimum 3 required
                  </Badge>
                )}
                {totalSelected >= 3 && (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700 dark:text-green-400"
                  >
                    Ready to proceed
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                disabled={totalSelected === 0}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>

            {/* Preview Section */}
            {showPreview && totalSelected > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Selected Strategies Preview</CardTitle>
                  <CardDescription>
                    These strategies will be included in your action plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedStrategies.map((strategy, index) => {
                      const hasCategory = 'category' in strategy;
                      return (
                        <li key={index} className="flex gap-3 rounded-lg border bg-background p-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{strategy.title}</h4>
                            <p className="text-sm text-muted-foreground">{strategy.description}</p>
                            {hasCategory && 'category' in strategy && (
                              <Badge
                                className={`mt-2 ${categoryConfig[strategy.category as CopingStrategyCategory].color}`}
                              >
                                {categoryConfig[strategy.category as CopingStrategyCategory].label}
                              </Badge>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Strategy Library by Category */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Strategy Library</h3>

              {groupedStrategies.map((group, groupIndex) => {
                const startIndex = groupedStrategies
                  .slice(0, groupIndex)
                  .reduce((sum, g) => sum + g.strategies.length, 0);

                return (
                  <div key={group.key}>
                    {/* Group header */}
                    <div className="mb-3">
                      <h4 className="text-base font-semibold">{group.label}</h4>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>

                    {/* Strategy cards */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.strategies.map((strategy, strategyIndex) => {
                        const globalIndex = startIndex + strategyIndex;
                        const isSelected = selectedIndices.has(globalIndex);
                        const config = categoryConfig[strategy.category];

                        return (
                          <button
                            key={globalIndex}
                            onClick={() => handleToggleStrategy(globalIndex)}
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

                    {/* Separator between groups (except last) */}
                    {groupIndex < groupedStrategies.length - 1 && <Separator className="mt-6" />}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Custom Strategies Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Custom Strategies</h3>
                  <p className="text-sm text-muted-foreground">
                    Add personalized strategies specific to your patients (up to 2)
                  </p>
                </div>
                {customStrategies.length < 2 && (
                  <Button
                    onClick={handleAddCustomStrategy}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom
                  </Button>
                )}
              </div>

              {customStrategies.map((custom, index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Label htmlFor={`custom-title-${index}`} className="text-base">
                          Custom Strategy {index + 1}
                        </Label>
                        {customStrategies.length > 1 && (
                          <Button
                            onClick={() => handleRemoveCustomStrategy(index)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`custom-title-${index}`}>Title</Label>
                        <Input
                          id={`custom-title-${index}`}
                          placeholder="e.g., Practice mindful eating"
                          value={custom.title}
                          onChange={(e) =>
                            handleCustomStrategyChange(index, 'title', e.target.value)
                          }
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`custom-description-${index}`}>Description</Label>
                        <textarea
                          id={`custom-description-${index}`}
                          rows={3}
                          placeholder="Describe how to practice this strategy..."
                          value={custom.description}
                          onChange={(e) =>
                            handleCustomStrategyChange(index, 'description', e.target.value)
                          }
                          maxLength={500}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Error message */}
            {error && planId && (
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
                disabled={saving || totalSelected < 3}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete & Save
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

export default function PlanBuilderStep2Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <PlanBuilderStep2Content />
    </Suspense>
  );
}
