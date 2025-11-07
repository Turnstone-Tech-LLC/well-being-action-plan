'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/contexts/AuthContext';
import { actionPlanService } from '@/lib/services/actionPlanService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowRight, FileText } from 'lucide-react';
import type { ActionPlanBasicInfo } from '@/lib/types';
import { AGE_RANGES } from '@/lib/types';

/**
 * Plan Builder - Basic Info Step
 *
 * First step in creating a new action plan where providers input:
 * - Plan name
 * - Age range
 * - Optional notes
 */
export default function NewPlanPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActionPlanBasicInfo>({
    defaultValues: {
      name: '',
      ageRange: undefined,
      notes: '',
    },
  });

  const onSubmit = async (data: ActionPlanBasicInfo) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate user is authenticated
      if (!user || !profile) {
        setError('You must be signed in to create action plans');
        return;
      }

      // Create the action plan with basic info
      const actionPlan = await actionPlanService.createActionPlan({
        providerId: user.id,
        name: data.name,
        ageRange: data.ageRange,
        notes: data.notes,
        status: 'draft',
        copingStrategyIds: [],
      });

      // Store plan ID in sessionStorage for multi-step form persistence
      sessionStorage.setItem('currentPlanId', actionPlan.id);

      // Navigate to step 2 (coping strategies selection)
      router.push(`/provider/plan/new/step-2?planId=${actionPlan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create New Action Plan
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Build a customized well-being action plan to share with your patients
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>
            Provide foundational information about your action plan. You&apos;ll be able to add
            coping strategies in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Plan Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Plan Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Teen Anxiety Management Plan"
                {...register('name', {
                  required: 'Plan name is required',
                  minLength: {
                    value: 3,
                    message: 'Plan name must be at least 3 characters',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Plan name must not exceed 100 characters',
                  },
                })}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for internal reference
              </p>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label htmlFor="ageRange">Target Age Range</Label>
              <select
                id="ageRange"
                {...register('ageRange')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">Select an age range (optional)</option>
                {AGE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select the appropriate age bracket to ensure strategy appropriateness
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Add any additional context, goals, or considerations for this plan..."
                {...register('notes', {
                  maxLength: {
                    value: 1000,
                    message: 'Notes must not exceed 1000 characters',
                  },
                })}
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                  errors.notes ? 'border-destructive' : ''
                }`}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
              <p className="text-xs text-muted-foreground">Optional supplementary information</p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/provider')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    Next: Add Strategies
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="flex h-2 w-2 rounded-full bg-primary" />
        <div className="flex h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="flex h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Step 1 of 3: Basic Info</p>
    </div>
  );
}
