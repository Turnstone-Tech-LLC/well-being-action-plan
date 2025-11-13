'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';

/**
 * Provider Settings Page
 *
 * Allows providers to manage their profile information including:
 * - Name and organization
 * - Contact information (email, phone, website)
 * - Logo upload (future feature)
 */
export default function ProviderSettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = React.useState('');

  // Form state
  const [formData, setFormData] = React.useState({
    name: profile?.name || '',
    organization: profile?.organization || '',
    email: profile?.email || '',
    phone: profile?.contactInfo?.phone || '',
    website: profile?.contactInfo?.website || '',
  });

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        organization: profile.organization || '',
        email: profile.email || '',
        phone: profile.contactInfo?.phone || '',
        website: profile.contactInfo?.website || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset save status when user makes changes
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to update settings');
      setSaveStatus('error');
      return;
    }

    try {
      setSaveStatus('saving');
      setErrorMessage('');

      // TODO: Implement profile update functionality
      // For now, just show success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSaveStatus('success');

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
      setSaveStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-catamount-green dark:text-[#7FD4B8]">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your provider profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This information will be included in patient onboarding links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Dr. Jane Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Mental Health Clinic"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Patients will see this information when they use your links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="provider@example.com"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Settings saved successfully
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errorMessage || 'Failed to save settings'}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/provider')}
              disabled={saveStatus === 'saving'}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
