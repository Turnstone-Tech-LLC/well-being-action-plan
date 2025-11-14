'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { providerService } from '@/lib/services/providerService';
import { ProviderLink } from '@/lib/types/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Download, QrCode } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { QRCode as QRCodeComponent } from '@/components/provider/QRCode';
import { CopingStrategyCard } from '@/components/coping-strategy-card';

/**
 * Link Detail Page
 *
 * Displays full details of a provider link with:
 * - Slug-based URL display
 * - Provider information
 * - Selected coping strategies
 * - Link metadata and status
 * - Action buttons (copy, download QR, edit, delete, etc.)
 */
export default function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [link, setLink] = useState<ProviderLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [id, setId] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Load link data
  useEffect(() => {
    if (!id || !user) return;

    const loadLink = async () => {
      try {
        setLoading(true);
        const linkData = await providerService.getLinkById(id);

        if (!linkData) {
          setError('Link not found');
          return;
        }

        if (linkData.provider_id !== user.id) {
          setError('Unauthorized');
          return;
        }

        setLink(linkData);
      } catch (err) {
        console.error('Error loading link:', err);
        setError(err instanceof Error ? err.message : 'Failed to load link');
      } finally {
        setLoading(false);
      }
    };

    loadLink();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading link details...</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Link not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.com';
  const shareableUrl = `${baseUrl}/link/${link.slug}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

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
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `wbap-qr-${link.slug}.png`;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      });

      window.URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Links
      </Button>

      {/* Shareable URL Card */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">Shareable Link</CardTitle>
          <CardDescription className="text-green-800 dark:text-green-200">
            Share this link with patients to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white p-4 dark:bg-slate-950">
            <p className="break-all font-mono text-sm">{shareableUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopyUrl} className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              onClick={() => setShowQRModal(!showQRModal)}
              variant="outline"
              className="flex-1"
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQRModal && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan with phone camera to access the link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center rounded-lg bg-white p-6">
              <QRCodeComponent id="qr-code-svg" value={shareableUrl} size={200} level="M" />
            </div>
            <Button onClick={handleDownloadQR} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Provider Information */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Name</p>
            <p className="text-lg font-medium">{link.link_config.provider.name}</p>
          </div>
          {link.link_config.provider.organization && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Organization</p>
              <p>{link.link_config.provider.organization}</p>
            </div>
          )}
          {link.link_config.provider.contactInfo && (
            <div className="space-y-2">
              {link.link_config.provider.contactInfo.email && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Email</p>
                  <p>{link.link_config.provider.contactInfo.email}</p>
                </div>
              )}
              {link.link_config.provider.contactInfo.phone && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Phone</p>
                  <p>{link.link_config.provider.contactInfo.phone}</p>
                </div>
              )}
              {link.link_config.provider.contactInfo.website && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Website</p>
                  <p>{link.link_config.provider.contactInfo.website}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Link Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Status</p>
              <Badge variant={link.is_active ? 'default' : 'secondary'}>
                {link.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Created</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Expires</p>
              <p className="text-sm">
                {link.expires_at
                  ? formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Patients Onboarded</p>
              <p className="text-sm font-bold">{link.metadata?.patientCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coping Strategies */}
      {link.link_config.copingStrategies && link.link_config.copingStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Coping Strategies</CardTitle>
            <CardDescription>
              {link.link_config.copingStrategies.length} strategies selected for patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {link.link_config.copingStrategies.map((strategy) => (
                <CopingStrategyCard key={strategy.id} strategy={strategy} showActions={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Message */}
      {link.link_config.customMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{link.link_config.customMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
