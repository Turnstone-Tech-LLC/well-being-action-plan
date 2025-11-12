'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZoneType } from '@/lib/types/zone';
import { createCheckIn } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CircleCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Green Zone Check-In Screen
 *
 * Check-in interface for patients in the Green (doing well) zone.
 * Features a positive user experience with minimal interaction steps.
 *
 * Features:
 * - Large, clear "Green Zone" visual indicator
 * - Positive affirmation message
 * - Quick mood confirmation with optional sub-zone selector
 * - "Save Check-In" button that persists data to IndexedDB
 * - Success confirmation message
 * - Navigation back to home screen
 */
export default function GreenZoneCheckIn() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sub-zones for Green mood (1-3 scale, all positive)
  const moodOptions = [
    { value: 8, label: 'Good', emoji: '😊' },
    { value: 9, label: 'Great', emoji: '😄' },
    { value: 10, label: 'Excellent', emoji: '🌟' },
  ];

  const handleSaveCheckIn = async () => {
    setSaving(true);

    try {
      // Create check-in entry with user ID (in a real app, this would come from auth)
      await createCheckIn({
        userId: 'default-user', // TODO: Replace with actual user ID from auth
        zone: ZoneType.Green,
        moodRating: selectedMood || 9, // Default to "Great" if not specified
      });

      setSaved(true);

      // Navigate back to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to save check-in:', error);
      // In a production app, show an error message to the user
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
        <Card className="w-full max-w-2xl border-green-zone bg-[#154734]/5 dark:bg-[#154734]/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#154734]/10 dark:bg-[#154734]/30">
              <Check className="h-10 w-10 text-green-zone dark:text-[#7FD4B8]" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-zone dark:text-[#7FD4B8]">
              Check-In Saved!
            </h2>
            <p className="text-green-zone dark:text-[#7FD4B8]">
              Great to hear you&apos;re doing well. Keep up the positive momentum!
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

        {/* Green Zone Indicator */}
        <Card className="border-2 border-green-zone bg-[#154734]/5 dark:bg-[#154734]/20">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#154734]/10 dark:bg-[#154734]/30">
                <CircleCheck className="h-12 w-12 text-green-zone dark:text-[#7FD4B8]" />
              </div>
            </div>
            <div className="mb-2 flex justify-center">
              <Badge className="bg-[#154734]/10 text-green-zone dark:bg-[#154734]/30 dark:text-[#7FD4B8]">
                Green Zone
              </Badge>
            </div>
            <CardTitle className="text-3xl text-green-zone dark:text-[#7FD4B8]">
              You&apos;re Doing Great! 🌱
            </CardTitle>
            <CardDescription className="text-lg text-green-zone dark:text-[#7FD4B8]">
              It&apos;s wonderful to see you in a positive place. Keep nurturing your well-being!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mood Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">How good are you feeling?</CardTitle>
            <CardDescription>Optional - Select the option that fits best</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMood(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:scale-105',
                    selectedMood === option.value
                      ? 'border-green-zone bg-[#154734]/5 dark:bg-[#154734]/20'
                      : 'border-border hover:border-green-zone/50'
                  )}
                  aria-label={`Select ${option.label} mood`}
                  aria-pressed={selectedMood === option.value}
                >
                  <span className="text-4xl" role="img" aria-label={option.label}>
                    {option.emoji}
                  </span>
                  <span className="font-medium">{option.label}</span>
                  {selectedMood === option.value && (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Positive Affirmation */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              Remember: Taking time to check in with yourself is an important part of maintaining
              your mental health. You&apos;re doing a great job!
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSaveCheckIn}
            disabled={saving}
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
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
