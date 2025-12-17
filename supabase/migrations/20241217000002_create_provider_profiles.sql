-- Migration: Create provider_profiles table
-- Description: Profile information for healthcare providers

create table if not exists provider_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) not null,
  email text not null,
  name text,
  role text default 'provider' check (role in ('admin', 'provider')),
  settings jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table provider_profiles is 'Profile information for healthcare providers linked to auth.users';
comment on column provider_profiles.id is 'References auth.users(id) - provider_profiles.id = auth.users.id';
comment on column provider_profiles.organization_id is 'The organization this provider belongs to';
comment on column provider_profiles.email is 'Provider email address (from auth.users)';
comment on column provider_profiles.name is 'Provider display name';
comment on column provider_profiles.role is 'Provider role: admin or provider';
comment on column provider_profiles.settings is 'User-specific settings and preferences';

-- Create indexes
create index if not exists idx_provider_profiles_organization_id on provider_profiles(organization_id);
create index if not exists idx_provider_profiles_email on provider_profiles(email);

-- Enable RLS
alter table provider_profiles enable row level security;

-- RLS Policy: Users can read their own profile
create policy "Users can view their own profile"
  on provider_profiles
  for select
  to authenticated
  using (id = auth.uid());

-- RLS Policy: Users can update their own profile
create policy "Users can update their own profile"
  on provider_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- RLS Policy: Admins can view all profiles in their organization
create policy "Admins can view organization profiles"
  on provider_profiles
  for select
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    and exists (
      select 1 from provider_profiles pp
      where pp.id = auth.uid()
      and pp.role = 'admin'
    )
  );

-- RLS Policy: Service role can insert new profiles (for trigger)
create policy "Service role can insert profiles"
  on provider_profiles
  for insert
  to service_role
  with check (true);

-- Trigger function to auto-create provider_profile on auth.users insert
-- This is called when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.provider_profiles (id, organization_id, email, name)
  values (
    new.id,
    (new.raw_app_meta_data ->> 'organization_id')::uuid,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users table
-- Note: This requires the trigger to run with elevated privileges
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Trigger to update updated_at timestamp
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'provider_profiles_updated_at'
  ) then
    create trigger provider_profiles_updated_at
      before update on provider_profiles
      for each row
      execute function update_updated_at_column();
  end if;
end;
$$;
