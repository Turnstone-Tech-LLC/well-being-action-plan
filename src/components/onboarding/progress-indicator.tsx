import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * Progress indicator component for multi-step flows
 * Shows current step and total steps with visual progress bar
 */
export function ProgressIndicator({ currentStep, totalSteps, className }: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        />
      </div>

      {/* Step text */}
      <div className="text-center text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}
