-- Migration: Fix provider_profiles RLS infinite recursion
-- Description: Replace recursive admin check with JWT-based check

-- Drop the problematic policy
drop policy if exists "Admins can view organization profiles" on provider_profiles;

-- Create a security definer function to check admin status without triggering RLS
create or replace function is_admin()
returns boolean as $$
declare
  v_role text;
begin
  select role into v_role
  from provider_profiles
  where id = auth.uid();

  return v_role = 'admin';
end;
$$ language plpgsql security definer stable;

-- Recreate the admin policy using the security definer function
create policy "Admins can view organization profiles"
  on provider_profiles
  for select
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    and is_admin()
  );
