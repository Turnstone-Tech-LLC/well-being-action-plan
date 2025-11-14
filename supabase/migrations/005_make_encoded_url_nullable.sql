-- Drop encoded_url column from provider_links table
-- This migration removes the legacy encoded_url field which is no longer used
-- The slug field is now the primary identifier for provider links
-- Provider configs are stored in link_config JSONB and accessed via /api/provider-link/[slug]

-- Drop the encoded_url column
ALTER TABLE provider_links
DROP COLUMN encoded_url;

