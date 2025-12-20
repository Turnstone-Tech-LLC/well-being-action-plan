-- Migration: Fix organizations RLS policy
-- Description: Update RLS policy to check provider_profiles.organization_id instead of JWT metadata
-- This allows newly signed up providers (who don't have organization_id in JWT) to access their organization

-- Drop the existing policy
drop policy if exists "Providers can view their own organization" on organizations;

-- Create new policy that checks provider_profiles table
create policy "Providers can view their own organization"
  on organizations
  for select
  to authenticated
  using (
    id in (
      select organization_id
      from provider_profiles
      where id = auth.uid()
    )
  );
