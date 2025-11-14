-- Onboarding Completions Tracking
-- This migration creates a minimal table to track when patients complete onboarding
-- via provider links. Privacy-first: only stores timestamp and link reference (no PHI).

-- Create onboarding_completions table
CREATE TABLE IF NOT EXISTS onboarding_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_link_id UUID NOT NULL REFERENCES provider_links(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient completion counting per link
CREATE INDEX IF NOT EXISTS idx_completions_provider_link_id 
  ON onboarding_completions(provider_link_id);

-- Index for time-based queries (recent completions, trends)
CREATE INDEX IF NOT EXISTS idx_completions_completed_at 
  ON onboarding_completions(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE onboarding_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow unauthenticated INSERT
-- Patients can record completions without authentication (privacy-first)
CREATE POLICY "Anyone can insert onboarding completions"
  ON onboarding_completions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Only authenticated providers can SELECT their own completions
-- Providers can only view completions for links they own
CREATE POLICY "Providers can view completions for their links"
  ON onboarding_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_links
      WHERE provider_links.id = onboarding_completions.provider_link_id
      AND provider_links.provider_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies - completions are immutable
-- Cascade delete handles cleanup when provider links are deleted

