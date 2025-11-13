/**
 * Expiration Picker Component
 *
 * Allows providers to set or modify link expiration dates.
 * Supports custom dates or "no expiration" option.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, X } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ExpirationPickerProps {
  currentExpiresAt: Date | null;
  onSave: (expiresAt: Date | null) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ExpirationPicker({
  currentExpiresAt,
  onSave,
  onCancel,
  isLoading = false,
}: ExpirationPickerProps) {
  const [expiresAt, setExpiresAt] = useState<Date | null>(currentExpiresAt);
  const [noExpiration, setNoExpiration] = useState(!currentExpiresAt);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (isNaN(date.getTime())) {
      setError('Invalid date');
      return;
    }
    if (date < new Date()) {
      setError('Expiration date must be in the future');
      return;
    }
    setExpiresAt(date);
    setError(null);
  };

  const handleNoExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setNoExpiration(checked);
    if (checked) {
      setExpiresAt(null);
    } else {
      setExpiresAt(addDays(new Date(), 30));
    }
    setError(null);
  };

  const handleSave = async () => {
    if (!noExpiration && !expiresAt) {
      setError('Please select an expiration date or choose no expiration');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(noExpiration ? null : expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expiration');
    } finally {
      setIsSaving(false);
    }
  };

  const dateValue = expiresAt ? format(expiresAt, 'yyyy-MM-dd') : '';

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="expiration-date">Expiration Date</Label>
        <Input
          id="expiration-date"
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          disabled={noExpiration || isSaving || isLoading}
          min={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="no-expiration"
          checked={noExpiration}
          onChange={handleNoExpirationChange}
          disabled={isSaving || isLoading}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="no-expiration" className="font-normal">
          No expiration
        </Label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading} className="flex-1">
          <Check className="mr-1 h-4 w-4" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving || isLoading}
          className="flex-1"
        >
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
