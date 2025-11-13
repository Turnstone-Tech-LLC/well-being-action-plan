-- Add public read access to provider_links table for active links
-- This migration enables the public API endpoint /api/provider-link/[slug] to work
-- by allowing anonymous users to read provider links by slug when they are active

-- Add a public read policy for provider links accessed by slug
-- This allows the /api/provider-link/[slug] endpoint to fetch configs without authentication
CREATE POLICY "Public users can view active provider links by slug"
  ON provider_links
  FOR SELECT
  USING (is_active = true);

-- Comment for documentation
COMMENT ON POLICY "Public users can view active provider links by slug" ON provider_links
IS 'Allows public access to provider links when accessed by slug and link is active. This enables the patient onboarding flow via /link/[slug] URLs.';
