/**
 * Public API endpoint for accessing provider links by slug
 * GET /api/provider-link/[slug]
 *
 * This endpoint:
 * - Validates the slug exists and is active
 * - Checks expiration status
 * - Returns the provider configuration
 * - Increments usage count
 * - Returns appropriate error codes (404, 410, 500)
 */

import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/lib/services/providerService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validate slug format
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Invalid slug parameter' }, { status: 400 });
    }

    // Fetch link from database
    const link = await providerService.getLinkBySlug(slug);

    if (!link) {
      return NextResponse.json({ error: 'Provider link not found' }, { status: 404 });
    }

    // Check if link is active
    if (!link.is_active) {
      return NextResponse.json({ error: 'Provider link is inactive' }, { status: 410 });
    }

    // Check if link has expired
    if (link.expires_at) {
      const expiresAt = new Date(link.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'Provider link has expired' }, { status: 410 });
      }
    }

    // Increment patient count (fire and forget)
    providerService.incrementPatientCount(link.id).catch((error) => {
      console.error('Failed to increment patient count:', error);
    });

    // Return provider configuration
    return NextResponse.json(
      {
        success: true,
        config: link.link_config,
        metadata: {
          createdAt: link.created_at,
          expiresAt: link.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching provider link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
