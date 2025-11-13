/**
 * Link Card Component
 *
 * Displays a provider link with status, metadata, and action buttons.
 * Shows expiration status with visual indicators.
 */

'use client';

import { ProviderLink } from '@/lib/types/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Edit2, Trash2, RotateCcw, Power, Download } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

interface LinkCardProps {
  link: ProviderLink;
  onClick?: (link: ProviderLink) => void;
  onEdit?: (link: ProviderLink) => void;
  onDelete?: (linkId: string) => void;
  onRenew?: (linkId: string) => void;
  onToggleActive?: (linkId: string, isActive: boolean) => void;
  onCopy?: (slug: string) => void;
  onDownloadQR?: (link: ProviderLink) => void;
}

export function LinkCard({
  link,
  onClick,
  onEdit,
  onDelete,
  onRenew,
  onToggleActive,
  onCopy,
  onDownloadQR,
}: LinkCardProps) {
  // Determine status
  const isExpired = link.expires_at ? isPast(new Date(link.expires_at)) : false;
  const isExpiringSoon =
    !isExpired && link.expires_at
      ? isPast(new Date(new Date(link.expires_at).getTime() - 7 * 24 * 60 * 60 * 1000))
      : false;

  // Get status badge
  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <span className="text-lg">🔴</span> Expired
        </Badge>
      );
    }
    if (!link.is_active) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <span className="text-lg">⚫</span> Inactive
        </Badge>
      );
    }
    if (isExpiringSoon) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-yellow-600 text-yellow-600"
        >
          <span className="text-lg">🟡</span> Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-green-600 text-green-600">
        <span className="text-lg">🟢</span> Active
      </Badge>
    );
  };

  return (
    <Card className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}>
      <CardHeader onClick={() => onClick?.(link)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-mono text-lg">{link.slug}</CardTitle>
            <CardDescription>
              Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Patients Onboarded</p>
            <p className="text-lg font-bold">{link.metadata?.patientCount || 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Expires</p>
            <p className="text-sm">
              {link.expires_at
                ? formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Provider Info */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">Provider</p>
          <p className="font-medium">{link.link_config.provider.name}</p>
          {link.link_config.provider.organization && (
            <p className="text-xs text-muted-foreground">
              {link.link_config.provider.organization}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy?.(link.slug)}
            className="flex-1"
          >
            <Copy className="mr-1 h-4 w-4" />
            Copy
          </Button>
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(link)} className="flex-1">
              <Edit2 className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
          {!isExpired && onRenew && (
            <Button size="sm" variant="outline" onClick={() => onRenew(link.id)} className="flex-1">
              <RotateCcw className="mr-1 h-4 w-4" />
              Renew
            </Button>
          )}
          {onToggleActive && (
            <Button
              size="sm"
              variant={link.is_active ? 'outline' : 'default'}
              onClick={() => onToggleActive(link.id, !link.is_active)}
              className="flex-1"
            >
              <Power className="mr-1 h-4 w-4" />
              {link.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          {onDownloadQR && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadQR(link)}
              className="flex-1"
            >
              <Download className="mr-1 h-4 w-4" />
              QR
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(link.id)}
              className="flex-1"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
