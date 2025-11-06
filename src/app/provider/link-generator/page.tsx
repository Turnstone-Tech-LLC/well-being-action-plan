'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ProviderLinkConfig, ProviderInfo } from '@/lib/types';
import { CopingStrategy, CopingStrategyCategory } from '@/lib/types/coping-strategy';
import { generateProviderUrl } from '@/lib/utils';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Eye,
  Download,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Activity,
  Users,
  Heart,
  Brain,
  Sparkles,
  Palette,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Category configuration for visual styling
 */
const categoryConfig: Record<
  CopingStrategyCategory,
  { icon: React.ElementType; color: string; label: string }
> = {
  [CopingStrategyCategory.Physical]: {
    icon: Activity,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    label: 'Physical',
  },
  [CopingStrategyCategory.Social]: {
    icon: Users,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    label: 'Social',
  },
  [CopingStrategyCategory.Emotional]: {
    icon: Heart,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    label: 'Emotional',
  },
  [CopingStrategyCategory.Cognitive]: {
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    label: 'Cognitive',
  },
  [CopingStrategyCategory.Sensory]: {
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    label: 'Sensory',
  },
  [CopingStrategyCategory.Creative]: {
    icon: Palette,
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    label: 'Creative',
  },
  [CopingStrategyCategory.Spiritual]: {
    icon: Sparkles,
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    label: 'Spiritual',
  },
  [CopingStrategyCategory.Other]: {
    icon: Sparkles,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    label: 'Other',
  },
};

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
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Generate provider ID on mount
  useEffect(() => {
    setProviderInfo((prev) => ({
      ...prev,
      id: `provider-${Date.now()}`,
    }));
  }, []);

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
   * Generate the shareable URL
   */
  const handleGenerateUrl = () => {
    try {
      setUrlError(null);

      // Validation
      if (!providerInfo.name.trim()) {
        setUrlError('Provider name is required');
        return;
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

      // Generate URL
      const url = generateProviderUrl(baseUrl, config);
      setGeneratedUrl(url);
    } catch (error) {
      console.error('Error generating URL:', error);
      setUrlError(
        error instanceof Error ? error.message : 'Failed to generate URL. Please try again.'
      );
    }
  };

  /**
   * Copy URL to clipboard
   */
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  /**
   * Download QR code as PNG
   */
  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new window.XMLSerializer().serializeToString(svg);
    const img = new window.Image();
    const blob = new window.Blob([svgData], { type: 'image/svg+xml' });
    const url = window.URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wbap-qr-${providerInfo.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
      });

      window.URL.revokeObjectURL(url);
    };

    img.src = url;
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
          Create a personalized onboarding link for your patients. They&apos;ll see your
          information and recommended coping strategies when they visit the link.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Form */}
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
                  onChange={(e) =>
                    setProviderInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
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

          {/* Generate Button */}
          <Button onClick={handleGenerateUrl} size="lg" className="w-full">
            <Link2 className="mr-2 h-4 w-4" />
            Generate Link
          </Button>

          {/* Error message */}
          {urlError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{urlError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Preview & QR Code */}
        <div className="space-y-6">
          {/* Generated URL */}
          {generatedUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Link Generated Successfully
                </CardTitle>
                <CardDescription>
                  Share this link with your patients to get them started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* URL Display */}
                <div className="rounded-lg bg-muted p-3">
                  <p className="break-all text-sm font-mono">{generatedUrl}</p>
                </div>

                {/* Copy Button */}
                <Button onClick={handleCopyUrl} variant="outline" className="w-full">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>

                {/* Preview Button */}
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </CardContent>
            </Card>
          )}

          {/* QR Code */}
          {generatedUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Patients can scan this code with their phone camera to access the link.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Display */}
                <div className="flex justify-center rounded-lg bg-white p-6">
                  <QRCodeSVG id="qr-code-svg" value={generatedUrl} size={200} level="H" />
                </div>

                {/* Download Button */}
                <Button onClick={handleDownloadQR} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>

                <p className="text-xs text-muted-foreground">
                  Print this QR code on appointment cards, flyers, or other materials.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {generatedUrl && showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Preview</CardTitle>
                <CardDescription>This is what patients will see when they open the link.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <p className="font-semibold">Welcome to Your Well-Being Action Plan</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {customMessage ||
                        `You've been invited by ${providerInfo.name} to create your personalized mental health support plan.`}
                    </p>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-semibold">Your Provider</p>
                      <p className="text-sm font-medium">{providerInfo.name}</p>
                      {providerInfo.organization && (
                        <p className="text-xs text-muted-foreground">{providerInfo.organization}</p>
                      )}
                    </div>
                    {selectedStrategies.size > 0 && (
                      <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
                        <p className="text-xs font-semibold">Recommended Strategies</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedStrategies.size} coping{' '}
                          {selectedStrategies.size === 1 ? 'strategy' : 'strategies'} selected for
                          you
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-base">How to Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Copy the link and send it via email or text</p>
              <p>2. Download the QR code and print it on materials</p>
              <p>3. Share the link on your website or patient portal</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Tip: Test the link yourself before sharing with patients to ensure everything looks
                correct.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
