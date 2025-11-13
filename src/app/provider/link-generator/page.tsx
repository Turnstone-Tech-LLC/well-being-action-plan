'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ProviderLinkConfig, ProviderInfo } from '@/lib/types';
import { CopingStrategy, CopingStrategyCategory } from '@/lib/types/coping-strategy';
import { generateProviderUrl, MAX_QR_CODE_URL_LENGTH } from '@/lib/utils';
import { categoryConfig } from '@/lib/config/categoryConfig';
import { providerService } from '@/lib/services/providerService';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Link2,
  Check,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Loader2,
} from 'lucide-react';

/**
 * Default coping strategies that providers can select from
 */
const DEFAULT_STRATEGIES: CopingStrategy[] = [
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
    title: 'Progressive Muscle Relaxation',
    description: 'Tense and relax each muscle group in your body, starting from your toes.',
    category: CopingStrategyCategory.Physical,
  },
  {
    id: 'default-4',
    title: 'Call a Friend',
    description: 'Reach out to a trusted friend or family member for support and connection.',
    category: CopingStrategyCategory.Social,
  },
  {
    id: 'default-5',
    title: 'Talk to Someone',
    description: 'Share your feelings with someone you trust.',
    category: CopingStrategyCategory.Social,
  },
  {
    id: 'default-6',
    title: 'Join a Support Group',
    description: 'Connect with others who understand what you are going through.',
    category: CopingStrategyCategory.Social,
  },
  {
    id: 'default-7',
    title: 'Journaling',
    description: 'Write down your thoughts and feelings in a journal to process emotions.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    id: 'default-8',
    title: 'Name Your Emotions',
    description: 'Identify and label what you are feeling to better understand your emotions.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    id: 'default-9',
    title: 'Self-Compassion Exercise',
    description: 'Practice being kind to yourself, as you would to a good friend.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    id: 'default-10',
    title: 'Positive Affirmations',
    description: 'Repeat positive statements to yourself to challenge negative thought patterns.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    id: 'default-11',
    title: 'Reframe Negative Thoughts',
    description: 'Challenge negative thinking by finding alternative, more balanced perspectives.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    id: 'default-12',
    title: 'Problem-Solving Technique',
    description: 'Break down challenges into manageable steps and identify solutions.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    id: 'default-13',
    title: 'Listen to Music',
    description: 'Put on calming or uplifting music to shift your emotional state.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    id: 'default-14',
    title: 'Use a Stress Ball',
    description: 'Squeeze a stress ball or hold something textured to ground yourself.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    id: 'default-15',
    title: 'Aromatherapy',
    description: 'Use calming scents like lavender or chamomile to relax.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    id: 'default-16',
    title: 'Creative Drawing',
    description: 'Express yourself through art, doodling, or coloring to release tension.',
    category: CopingStrategyCategory.Creative,
  },
  {
    id: 'default-17',
    title: 'Play an Instrument',
    description: 'Make music as a form of creative expression and emotional release.',
    category: CopingStrategyCategory.Creative,
  },
  {
    id: 'default-18',
    title: 'Write Poetry or Stories',
    description: 'Use creative writing to explore and express your feelings.',
    category: CopingStrategyCategory.Creative,
  },
];

/**
 * Provider Link Generator Page
 *
 * Allows providers to:
 * - Enter their information
 * - Select coping strategies
 * - Generate shareable links with QR codes
 * - Preview what patients will see
 */
export default function ProviderLinkGeneratorPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Provider information state
  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    id: '',
    name: '',
    organization: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
    },
  });

  const [customMessage, setCustomMessage] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [noExpiration, setNoExpiration] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [qrCodeWarning, setQrCodeWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Generate provider ID on mount
  useEffect(() => {
    setProviderInfo((prev) => ({
      ...prev,
      id: user?.id || `provider-${Date.now()}`,
    }));
  }, [user?.id]);

  /**
   * Toggle coping strategy selection
   */
  const handleToggleStrategy = (strategyId: string) => {
    setSelectedStrategies((prev) => {
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
   * Generate and save the link to the database
   * This combines the old "Generate" and "Save" steps into one action
   */
  const handleGenerateUrl = async () => {
    try {
      setUrlError(null);
      setQrCodeWarning(null);
      setIsSaving(true);

      // Validation
      if (!providerInfo.name.trim()) {
        setUrlError('Provider name is required');
        return;
      }

      // Note: user is guaranteed to exist due to middleware protection on /provider/* routes
      if (!user) {
        throw new Error('User session not found. Please sign in again.');
      }

      if (!user.id) {
        throw new Error('User ID is missing. Please sign in again.');
      }

      // Build configuration
      const config: ProviderLinkConfig = {
        provider: {
          id: providerInfo.id,
          name: providerInfo.name.trim(),
          organization: providerInfo.organization?.trim() || undefined,
          contactInfo: {
            phone: providerInfo.contactInfo?.phone?.trim() || undefined,
            email: providerInfo.contactInfo?.email?.trim() || undefined,
            website: providerInfo.contactInfo?.website?.trim() || undefined,
          },
        },
        customMessage: customMessage.trim() || undefined,
        copingStrategies:
          selectedStrategies.size > 0
            ? DEFAULT_STRATEGIES.filter((s) => selectedStrategies.has(s.id))
            : undefined,
      };

      // Get base URL
      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      // Generate URL (for backward compatibility)
      const url = generateProviderUrl(baseUrl, config);

      // Check if URL is too long for QR codes
      if (url.length > MAX_QR_CODE_URL_LENGTH) {
        setQrCodeWarning(
          `The URL is ${url.length} characters long, which may be too large for reliable QR code scanning. ` +
            `Consider selecting fewer coping strategies or shortening your custom message.`
        );
      }

      // Calculate expiration date
      const expiresAt = noExpiration ? null : new Date();
      if (expiresAt) {
        expiresAt.setDate(expiresAt.getDate() + expirationDays);
      }

      // Save to database with auto-generated slug
      const link = await providerService.createLink(user.id, config, url, {
        expiresAt: expiresAt || undefined,
      });

      // Redirect to link detail page
      router.push(`/provider/links/${link.id}`);
    } catch (error) {
      let errorMessage = 'Failed to generate link. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      console.error('Error generating and saving link:', errorMessage);
      setUrlError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Group strategies by category
  const strategiesByCategory = DEFAULT_STRATEGIES.reduce(
    (acc, strategy) => {
      if (!acc[strategy.category]) {
        acc[strategy.category] = [];
      }
      acc[strategy.category].push(strategy);
      return acc;
    },
    {} as Record<CopingStrategyCategory, CopingStrategy[]>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Generate Provider Link</h1>
        <p className="mt-2 text-muted-foreground">
          Create a personalized onboarding link for your patients. They&apos;ll see your information
          and recommended coping strategies when they visit the link.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Form */}
        <div className="space-y-6">
          {/* Provider Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Provider Information</CardTitle>
              </div>
              <CardDescription>
                Enter your details. This information will be visible to patients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Dr. Sarah Johnson"
                  value={providerInfo.name}
                  onChange={(e) => setProviderInfo((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organization"
                    placeholder="Community Mental Health Center"
                    value={providerInfo.organization}
                    onChange={(e) =>
                      setProviderInfo((prev) => ({ ...prev, organization: e.target.value }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Contact Information (Optional)</Label>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs">
                    Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={providerInfo.contactInfo?.phone}
                      onChange={(e) =>
                        setProviderInfo((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, phone: e.target.value },
                        }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="sarah.johnson@cmhc.org"
                      value={providerInfo.contactInfo?.email}
                      onChange={(e) =>
                        setProviderInfo((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, email: e.target.value },
                        }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs">
                    Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://cmhc.org"
                      value={providerInfo.contactInfo?.website}
                      onChange={(e) =>
                        setProviderInfo((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, website: e.target.value },
                        }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Welcome Message */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <CardTitle>Welcome Message</CardTitle>
              </div>
              <CardDescription>
                Add a personal message that patients will see on the landing page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Welcome! I'm excited to support you on your mental health journey. This well-being action plan will help you identify strategies that work best for you."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                If left empty, a default welcome message will be shown.
              </p>
            </CardContent>
          </Card>

          {/* Coping Strategies Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Coping Strategies</CardTitle>
              <CardDescription>
                Select strategies to recommend to your patients. They can customize these later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selection count */}
              <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                <span className="font-medium">
                  {selectedStrategies.size}{' '}
                  {selectedStrategies.size === 1 ? 'strategy' : 'strategies'} selected
                </span>
                {selectedStrategies.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStrategies(new Set())}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Strategies grouped by category */}
              <div className="space-y-4">
                {Object.entries(strategiesByCategory).map(([category, strategies]) => {
                  const config = categoryConfig[category as CopingStrategyCategory];
                  const Icon = config.icon;
                  const categorySelected = strategies.filter((s) =>
                    selectedStrategies.has(s.id)
                  ).length;

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold">{config.label}</h3>
                        </div>
                        {categorySelected > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {categorySelected} selected
                          </Badge>
                        )}
                      </div>

                      {/* Strategy checkboxes */}
                      <div className="space-y-2">
                        {strategies.map((strategy) => {
                          const isSelected = selectedStrategies.has(strategy.id);

                          return (
                            <button
                              key={strategy.id}
                              onClick={() => handleToggleStrategy(strategy.id)}
                              className={`w-full rounded-md border p-3 text-left text-sm transition-all hover:border-primary/50 ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border bg-background'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 ${
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground/30'
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{strategy.title}</p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {strategy.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                If no strategies are selected, patients will see a default set of 12 strategies.
              </p>
            </CardContent>
          </Card>

          {/* Link Expiration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Link Expiration</CardTitle>
              <CardDescription>Set when this link should expire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="expiration-days">Expires in (days)</Label>
                  <Input
                    id="expiration-days"
                    type="number"
                    min="1"
                    max="365"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={noExpiration}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="no-expiration"
                  checked={noExpiration}
                  onChange={(e) => setNoExpiration(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="no-expiration" className="font-normal">
                  No expiration
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button onClick={handleGenerateUrl} size="lg" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Link...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Generate Link
              </>
            )}
          </Button>

          {/* Error message */}
          {urlError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          {/* QR Code Warning */}
          {qrCodeWarning && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-600 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{qrCodeWarning}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
