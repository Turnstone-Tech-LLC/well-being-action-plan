/**
 * Onboarding Completion Tracking API
 * POST /api/onboarding/complete
 *
 * Records when a patient completes onboarding via a provider link.
 * Privacy-first: only stores timestamp and link reference (no PHI).
 *
 * This endpoint:
 * - Accepts unauthenticated requests (maintains local-first architecture)
 * - Validates provider link exists and is active
 * - Inserts completion record into onboarding_completions table
 * - Returns success/error status
 *
 * Request body:
 * {
 *   providerLinkId: string  // UUID of the provider_links record
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { providerLinkId } = body;

    // Validate input
    if (!providerLinkId || typeof providerLinkId !== 'string') {
      return NextResponse.json({ error: 'Invalid provider link ID' }, { status: 400 });
    }

    // Create server-side Supabase client
    const supabase = await createClient();

    // Validate that provider link exists and is active
    const { data: link, error: linkError } = await supabase
      .from('provider_links')
      .select('id, is_active, expires_at')
      .eq('id', providerLinkId)
      .single();

    if (linkError) {
      if (linkError.code === 'PGRST116') {
        // Not found
        return NextResponse.json({ error: 'Provider link not found' }, { status: 404 });
      }
      throw linkError;
    }

    if (!link) {
      return NextResponse.json({ error: 'Provider link not found' }, { status: 404 });
    }

    // Check if link is active
    if (!link.is_active) {
      return NextResponse.json({ error: 'Provider link is inactive' }, { status: 400 });
    }

    // Check if link has expired
    if (link.expires_at) {
      const expiresAt = new Date(link.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'Provider link has expired' }, { status: 400 });
      }
    }

    // Insert completion record
    // RLS policy allows unauthenticated INSERT
    const { error: insertError } = await supabase.from('onboarding_completions').insert({
      provider_link_id: providerLinkId,
      // completed_at is set automatically by database DEFAULT
    });

    if (insertError) {
      console.error('Failed to insert onboarding completion:', insertError);
      return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
    }

    // Success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error recording onboarding completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
