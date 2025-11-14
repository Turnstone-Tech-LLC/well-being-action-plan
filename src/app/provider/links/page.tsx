'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { providerService } from '@/lib/services/providerService';
import { LinkCard } from '@/components/provider/LinkCard';
import { SlugEditor } from '@/components/provider/SlugEditor';
import { ExpirationPicker } from '@/components/provider/ExpirationPicker';
import { ProviderLink } from '@/lib/types/provider';
import { Link2, AlertCircle, Loader2 } from 'lucide-react';
import { QRCode } from '@/components/provider/QRCode';

export default function ProviderLinksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [links, setLinks] = useState<ProviderLink[]>([]);
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingExpiration, setEditingExpiration] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<ProviderLink | null>(null);

  // Load links on mount
  // Note: user is guaranteed to exist due to middleware protection on /provider/* routes
  useEffect(() => {
    if (!user) return;
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load completion counts when links change
  useEffect(() => {
    const loadCompletions = async () => {
      if (links.length === 0) return;

      try {
        const counts: Record<string, number> = {};
        await Promise.all(
          links.map(async (link) => {
            const count = await providerService.getCompletionCount(link.id);
            counts[link.id] = count;
          })
        );
        setCompletionCounts(counts);
      } catch (err) {
        console.error('Error loading completion counts:', err);
      }
    };

    loadCompletions();
  }, [links]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) {
        throw new Error('User session not found');
      }
      const allLinks = await providerService.getAllLinks(user.id);
      setLinks(allLinks);
    } catch (err) {
      console.error('Error loading links:', err);
      setError(err instanceof Error ? err.message : 'Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await providerService.deleteLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete link';
      setError(message);
    }
  };

  const handleRenewLink = async (linkId: string) => {
    try {
      await providerService.renewLink(linkId);
      await loadLinks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to renew link';
      setError(message);
    }
  };

  const handleToggleActive = async (linkId: string, isActive: boolean) => {
    try {
      await providerService.updateLinkStatus(linkId, isActive);
      await loadLinks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update link status';
      setError(message);
    }
  };

  const handleUpdateSlug = async (linkId: string, newSlug: string) => {
    try {
      await providerService.updateLinkSlug(linkId, newSlug);
      setEditingSlug(null);
      await loadLinks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update slug';
      setError(message);
    }
  };

  const handleUpdateExpiration = async (linkId: string, expiresAt: Date | null) => {
    try {
      await providerService.updateLinkExpiration(linkId, expiresAt);
      setEditingExpiration(null);
      await loadLinks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update expiration';
      setError(message);
    }
  };

  const handleCopySlug = async (slug: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.com';
    const url = `${baseUrl}/link/${slug}`;
    await navigator.clipboard.writeText(url);
  };

  const renderLinkCard = (link: ProviderLink) => {
    if (editingSlug === link.id) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Slug</CardTitle>
          </CardHeader>
          <CardContent>
            <SlugEditor
              currentSlug={link.slug}
              onSave={(newSlug) => handleUpdateSlug(link.id, newSlug)}
              onCancel={() => setEditingSlug(null)}
            />
          </CardContent>
        </Card>
      );
    }

    if (editingExpiration === link.id) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Expiration</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpirationPicker
              currentExpiresAt={link.expires_at ? new Date(link.expires_at) : null}
              onSave={(expiresAt) => handleUpdateExpiration(link.id, expiresAt)}
              onCancel={() => setEditingExpiration(null)}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <LinkCard
        link={link}
        completionCount={completionCounts[link.id]}
        onClick={(link) => router.push(`/provider/links/${link.id}`)}
        onEdit={() => setEditingSlug(link.id)}
        onDelete={() => handleDeleteLink(link.id)}
        onRenew={() => handleRenewLink(link.id)}
        onToggleActive={(id, isActive) => handleToggleActive(id, isActive)}
        onCopy={() => handleCopySlug(link.slug)}
        onDownloadQR={() => setShowQRModal(link)}
      />
    );
  };

  const handleDownloadQR = (link: ProviderLink) => {
    const svg = document.getElementById(`qr-${link.id}`);
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new window.XMLSerializer().serializeToString(svg);
    const img = new window.Image();
    const blob = new window.Blob([svgData], { type: 'image/svg+xml' });
    const blobUrl = window.URL.createObjectURL(blob);

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
        a.download = `wbap-qr-${link.slug}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
      });

      window.URL.revokeObjectURL(blobUrl);
    };

    img.src = blobUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Provider Links</h1>
          <p className="mt-2 text-muted-foreground">
            Manage all your patient onboarding links in one place.
          </p>
        </div>
        <Button onClick={() => router.push('/provider/link-generator')} size="lg">
          <Link2 className="mr-2 h-4 w-4" />
          Create New Link
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      {links.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{links.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{links.filter((l) => l.is_active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(completionCounts).reduce((sum, count) => sum + count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Links Grid */}
      {links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No links yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first provider link to start onboarding patients.
            </p>
            <Button onClick={() => router.push('/provider/link-generator')}>
              Create First Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {links.map((link) => (
            <div key={link.id} className="space-y-2">
              {renderLinkCard(link)}
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>{showQRModal.slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center rounded-lg bg-white p-6">
                <QRCode
                  id={`qr-${showQRModal.id}`}
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'https://app.com'}/link/${showQRModal.slug}`}
                  size={200}
                  level="M"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownloadQR(showQRModal)} className="flex-1">
                  Download
                </Button>
                <Button variant="outline" onClick={() => setShowQRModal(null)} className="flex-1">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
