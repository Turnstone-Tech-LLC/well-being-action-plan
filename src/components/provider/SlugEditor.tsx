/**
 * Slug Editor Component
 *
 * Inline editor for customizing provider link slugs.
 * Validates slug format and provides real-time feedback.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Check, X } from 'lucide-react';

interface SlugEditorProps {
  currentSlug: string;
  onSave: (newSlug: string) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function SlugEditor({ currentSlug, onSave, onCancel, isLoading = false }: SlugEditorProps) {
  const [slug, setSlug] = useState(currentSlug);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const validateSlug = (value: string): boolean => {
    if (!value.trim()) {
      setError('Slug cannot be empty');
      return false;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens');
      return false;
    }
    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSlug(value);
    if (value !== currentSlug) {
      validateSlug(value);
    } else {
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!validateSlug(slug)) {
      return;
    }

    if (slug === currentSlug) {
      onCancel?.();
      return;
    }

    try {
      setIsSaving(true);
      await onSave(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save slug');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={slug}
          onChange={handleChange}
          placeholder="e.g., green-mountain-trail"
          disabled={isSaving || isLoading}
          className="font-mono"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isLoading || slug === currentSlug || !!error}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving || isLoading}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
