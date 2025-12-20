-- Migration: Allow pending provider profiles
-- Description: Remove FK constraint so admins can create providers before they have auth accounts
-- Providers can claim their account later by signing up with the same email

-- Drop the foreign key constraint on provider_profiles.id
alter table provider_profiles drop constraint if exists provider_profiles_id_fkey;

-- Add a new column to track whether the provider has claimed their account
alter table provider_profiles add column if not exists claimed_at timestamp with time zone;

-- Add comment for documentation
comment on column provider_profiles.claimed_at is 'When the provider claimed their account by signing up. NULL = pending invite.';

-- Update the trigger to link existing pending profiles when a user signs up
create or replace function handle_new_user()
returns trigger as $$
declare
  v_existing_profile_id uuid;
begin
  -- Check if there's a pending profile for this email
  select id into v_existing_profile_id
  from public.provider_profiles
  where email = new.email
    and claimed_at is null
  limit 1;

  if v_existing_profile_id is not null then
    -- Update the existing profile to link to this auth user
    update public.provider_profiles
    set id = new.id,
        claimed_at = now(),
        updated_at = now()
    where id = v_existing_profile_id;
  else
    -- Only create new profile if organization_id is provided (provider signup)
    if new.raw_app_meta_data ->> 'organization_id' is not null then
      insert into public.provider_profiles (id, organization_id, email, name, claimed_at)
      values (
        new.id,
        (new.raw_app_meta_data ->> 'organization_id')::uuid,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
        now()
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
