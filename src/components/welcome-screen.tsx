/**
 * Welcome Screen Component
 *
 * Displays a welcome screen for new patients without a provider access code.
 * Provides options to enter an access code or import existing data.
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Download, Loader2 } from 'lucide-react';

export interface WelcomeScreenProps {
  /**
   * Initial access code value (from URL parameter)
   */
  initialAccessCode?: string;

  /**
   * Callback when user submits an access code
   */
  onAccessCodeSubmit: (accessCode: string) => void;

  /**
   * Callback when user clicks "Import Data"
   */
  onImportData: () => void;

  /**
   * Whether the access code is being validated
   */
  loading?: boolean;

  /**
   * Error message to display
   */
  error?: string | null;
}

/**
 * Welcome Screen Component
 *
 * @example
 * ```tsx
 * <WelcomeScreen
 *   initialAccessCode={accessCodeFromUrl}
 *   onAccessCodeSubmit={(code) => validateAndRedirect(code)}
 *   onImportData={() => setShowImportDialog(true)}
 *   loading={isValidating}
 *   error={validationError}
 * />
 * ```
 */
export function WelcomeScreen({
  initialAccessCode = '',
  onAccessCodeSubmit,
  onImportData,
  loading = false,
  error = null,
}: WelcomeScreenProps) {
  const [accessCode, setAccessCode] = useState(initialAccessCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      onAccessCodeSubmit(accessCode.trim());
    }
  };

  const isAccessCodeValid = accessCode.trim().length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* UVM Branding Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-catamount-green">Well-Being Action Plan</h1>
        <p className="mt-2 text-sm text-vermont-slate">
          Developed in collaboration with The University of Vermont Children&apos;s Hospital
        </p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Get started with your personalized mental health support plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="mt-1 text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          {/* Access Code Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Provider Access Code</Label>
              <Input
                id="access-code"
                type="text"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={loading}
                className="font-mono"
                aria-describedby="access-code-description"
              />
              <p id="access-code-description" className="text-sm text-muted-foreground">
                Enter the access code provided by your mental health provider
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isAccessCodeValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Import Data Option */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onImportData}
            disabled={loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Import Existing Data
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Returning user? Import your previously exported data to restore your plan.
          </p>

          {/* What is this? */}
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <h3 className="text-sm font-semibold">What is the Well-Being Action Plan?</h3>
            <p className="text-sm text-muted-foreground">
              A personalized mental health support tool that helps you:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-catamount-green" />
                <span>Recognize your emotional states using a traffic light system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-uvm-gold" />
                <span>Identify coping strategies that work for you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-old-mill" />
                <span>Track your mental health journey over time</span>
              </li>
            </ul>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium">Privacy First</p>
            <p className="mt-1">
              Your mental health data stays private on your device. We use local storage only and
              never send your personal information to external servers.
            </p>
          </div>

          {/* Need Help? */}
          <div className="border-t pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an access code?{' '}
              <span className="font-medium">Contact your mental health provider</span> to get
              started.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
