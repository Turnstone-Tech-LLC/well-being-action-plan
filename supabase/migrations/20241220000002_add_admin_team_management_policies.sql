-- Migration: Add admin team management RLS policies
-- Description: Allow admins to manage provider profiles in their organization
-- Required for TUR-50: Team Management functionality

-- Create a security definer function to get admin's organization_id
create or replace function get_admin_organization_id()
returns uuid as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from provider_profiles
  where id = auth.uid() and role = 'admin';

  return v_org_id;
end;
$$ language plpgsql security definer stable;

-- Admins can insert new providers in their organization
-- Note: The new provider must be in the same organization as the admin
create policy "Admins can insert org providers"
  on provider_profiles
  for insert
  to authenticated
  with check (
    is_admin()
    and organization_id = get_admin_organization_id()
  );

-- Admins can update providers in their org (except themselves)
create policy "Admins can update org providers"
  on provider_profiles
  for update
  to authenticated
  using (
    id != auth.uid()
    and is_admin()
    and organization_id = get_admin_organization_id()
  )
  with check (
    id != auth.uid()
    and is_admin()
    and organization_id = get_admin_organization_id()
  );

-- Admins can delete providers in their org (except themselves)
create policy "Admins can delete org providers"
  on provider_profiles
  for delete
  to authenticated
  using (
    id != auth.uid()
    and is_admin()
    and organization_id = get_admin_organization_id()
  );

-- Also add policy for admins to update their own organization
-- Note: Need to check if organizations table has RLS enabled
do $$
begin
  -- Check if policy already exists
  if not exists (
    select 1 from pg_policies
    where tablename = 'organizations'
    and policyname = 'Admins can update own org'
  ) then
    execute 'create policy "Admins can update own org"
      on organizations
      for update
      to authenticated
      using (
        id = get_admin_organization_id()
      )
      with check (
        id = get_admin_organization_id()
      )';
  end if;
end;
$$;
