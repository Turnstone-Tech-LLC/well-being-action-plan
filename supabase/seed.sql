-- =============================================================================
-- WBAP 2.0 Seed Data
-- =============================================================================
-- This file populates all resource tables with seed data matching the
-- Well-Being Action Plan 2.0 physical card.
--
-- IMPORTANT: This seed file is idempotent and can be run multiple times safely.
-- It runs automatically during `supabase db reset`.
-- =============================================================================

-- =============================================================================
-- 1. Default Organization
-- =============================================================================
-- Create the default organization for local development.
insert into organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'UVM Children''s Hospital',
  'uvm-childrens'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug;

-- =============================================================================
-- 2. Skills (Green Zone - Coping Strategies)
-- =============================================================================
-- Delete existing global skills to ensure clean seed (only global ones)
delete from skills where organization_id is null;

-- Physical category
insert into skills (organization_id, title, category, has_fill_in, fill_in_prompt, display_order) values
  (null, 'Move my body', 'physical', true, 'how?', 1),
  (null, 'Go outside: 30-60 min. a day', 'physical', false, null, 2),
  (null, 'Get lots of sleep: 8-10 hours', 'physical', false, null, 3),
  (null, 'Eat a variety of foods throughout the day', 'physical', false, null, 4),
  (null, 'Take a shower or bath to relax', 'physical', false, null, 5),
  (null, 'Take a break', 'physical', true, null, 6);

-- Creative category
insert into skills (organization_id, title, category, has_fill_in, fill_in_prompt, display_order) values
  (null, 'Read', 'creative', false, null, 7),
  (null, 'Write/journal', 'creative', false, null, 8),
  (null, 'Draw/paint', 'creative', false, null, 9),
  (null, 'Craft/knit/create', 'creative', false, null, 10),
  (null, 'Listen/play music', 'creative', false, null, 11);

-- Social category
insert into skills (organization_id, title, category, has_fill_in, fill_in_prompt, display_order) values
  (null, 'Play games', 'social', false, null, 12),
  (null, 'Play with pets', 'social', false, null, 13),
  (null, 'Help someone else', 'social', false, null, 14),
  (null, 'Spend time with supportive family', 'social', false, null, 15),
  (null, 'Spend time with helpful friends', 'social', false, null, 16),
  (null, 'Talk to a supportive adult', 'social', false, null, 17);

-- Mindfulness category
insert into skills (organization_id, title, category, has_fill_in, fill_in_prompt, display_order) values
  (null, 'Pray or meditate', 'mindfulness', false, null, 18),
  (null, 'Laugh', 'mindfulness', false, null, 19),
  (null, 'Focus on something positive', 'mindfulness', false, null, 20),
  (null, 'Take deep breaths', 'mindfulness', false, null, 21);

-- =============================================================================
-- 3. Supportive Adult Types
-- =============================================================================
-- Delete existing global supportive adult types to ensure clean seed
delete from supportive_adult_types where organization_id is null;

insert into supportive_adult_types (organization_id, label, has_fill_in, display_order) values
  (null, 'Parent/guardian', false, 1),
  (null, 'Older sister or brother', false, 2),
  (null, 'Grandparent', true, 3),
  (null, 'Therapist/Counselor', true, 4),
  (null, 'Coach', true, 5),
  (null, 'Teacher', true, 6),
  (null, 'Other adult', true, 7);

-- =============================================================================
-- 4. Help Methods (Yellow Zone)
-- =============================================================================
-- Delete existing global help methods to ensure clean seed
delete from help_methods where organization_id is null;

insert into help_methods (organization_id, title, description, display_order) values
  (null, 'Help identifying and managing my emotions', null, 1),
  (null, 'More coping skills and strategies', null, 2),
  (null, 'Help to better use the coping skills I have', null, 3),
  (null, 'A mental health counselor/therapist or my doctor', null, 4);

-- =============================================================================
-- 5. Crisis Resources (Red Zone)
-- =============================================================================
-- Delete existing global crisis resources to ensure clean seed
delete from crisis_resources where organization_id is null;

insert into crisis_resources (organization_id, name, contact, contact_type, description, display_order) values
  (null, 'Crisis Text Line', '741741', 'text', 'Text HOME to 741741 to connect with a Crisis Counselor', 1),
  (null, 'National Suicide Prevention Line', '988', 'phone', 'Call or text 988 for 24/7 crisis support', 2);

-- =============================================================================
-- 6. Admin Provider Creation for Local Development
-- =============================================================================
-- This creates an admin provider user for local development.
-- Edit the email below to use a different admin account.

do $$
declare
  v_user_id uuid;
  v_admin_email text := 'jordan.morano@gmail.com';
  v_org_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- Check if user already exists
  select id into v_user_id from auth.users where email = v_admin_email;

  if v_user_id is not null then
    -- User exists, ensure they have admin role
    update provider_profiles
    set role = 'admin'
    where id = v_user_id;
    raise notice 'Admin provider already exists: %', v_admin_email;
    return;
  end if;

  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();

  -- Insert into auth.users with all required columns for GoTrue compatibility
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_admin_email,
    crypt(gen_random_uuid()::text, gen_salt('bf')),
    now(), -- Auto-confirm for seed users
    jsonb_build_object('organization_id', v_org_id, 'provider', true),
    jsonb_build_object('name', 'Admin Provider'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',  -- email_change
    '',  -- email_change_token_new
    '',  -- email_change_token_current
    null, -- phone
    '',  -- phone_change
    '',  -- phone_change_token
    '',  -- reauthentication_token
    false, -- is_sso_user
    false  -- is_anonymous
  );

  -- The trigger will create the provider_profile, but we need to set admin role
  update provider_profiles
  set role = 'admin', name = 'Admin Provider'
  where id = v_user_id;

  raise notice 'Created admin provider: %', v_admin_email;
end;
$$;

-- =============================================================================
-- Seed Summary
-- =============================================================================
-- After running this seed, the database will contain:
-- - 1 organization: UVM Children's Hospital
-- - 21 skills across 4 categories (physical, creative, social, mindfulness)
-- - 7 supportive adult types
-- - 4 help methods
-- - 2 crisis resources
-- - 1 admin provider: jordan.morano@gmail.com
--
-- To change the admin email or organization, edit the values directly in this file.
-- =============================================================================
