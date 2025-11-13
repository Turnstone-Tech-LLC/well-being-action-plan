-- Add slug column to provider_links table
-- This migration adds support for Vermont-inspired friendly URLs for provider links

-- Add slug column with unique constraint
ALTER TABLE provider_links 
ADD COLUMN slug TEXT UNIQUE NOT NULL DEFAULT '';

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_provider_links_slug ON provider_links(slug);

-- Update existing rows with a temporary slug based on their ID
-- This ensures the NOT NULL constraint is satisfied
UPDATE provider_links 
SET slug = 'legacy-' || SUBSTRING(id::text, 1, 8)
WHERE slug = '';

-- Now we can safely add the NOT NULL constraint if needed
-- (already applied in the ADD COLUMN statement above)

-- Add comment for documentation
COMMENT ON COLUMN provider_links.slug IS 'Vermont-inspired friendly URL slug (e.g., green-mountain-trail). Must be unique and match pattern: ^[a-z0-9]+(-[a-z0-9]+)*$';

