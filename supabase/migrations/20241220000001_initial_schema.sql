-- =============================================================================
-- WBAP 2.0 Initial Schema
-- =============================================================================
-- This is the consolidated schema for the Well-Being Action Plan application.
-- It creates all tables, functions, triggers, and RLS policies.
--
-- KEY DESIGN DECISIONS:
-- 1. RLS policies use provider_profiles lookups (not JWT app_metadata) for
--    consistent organization access control that works immediately on login.
-- 2. Security definer functions are used to bypass RLS when checking admin status.
-- 3. Anonymous access is allowed for specific flows (token validation, installs).
-- =============================================================================

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Trigger function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================
-- Healthcare organizations/facilities that use the WBAP system

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  settings jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table organizations is 'Healthcare organizations/facilities that use the Well-Being Action Plan system';
comment on column organizations.name is 'Display name of the organization';
comment on column organizations.slug is 'URL-friendly unique identifier';
comment on column organizations.settings is 'Organization-specific settings and configuration';

create index idx_organizations_slug on organizations(slug);

create trigger organizations_updated_at
  before update on organizations
  for each row
  execute function update_updated_at_column();

alter table organizations enable row level security;

-- =============================================================================
-- PROVIDER PROFILES
-- =============================================================================
-- Profile information for healthcare providers

create table provider_profiles (
  id uuid primary key,  -- No FK to auth.users to allow pending profiles
  organization_id uuid references organizations(id) not null,
  email text not null,
  name text,
  role text default 'provider' check (role in ('admin', 'provider')),
  settings jsonb default '{}',
  claimed_at timestamp with time zone,  -- NULL = pending invite, set when user signs up
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table provider_profiles is 'Profile information for healthcare providers linked to auth.users';
comment on column provider_profiles.id is 'UUID matching auth.users(id) after account is claimed';
comment on column provider_profiles.organization_id is 'The organization this provider belongs to';
comment on column provider_profiles.email is 'Provider email address';
comment on column provider_profiles.name is 'Provider display name';
comment on column provider_profiles.role is 'Provider role: admin or provider';
comment on column provider_profiles.settings is 'User-specific settings and preferences';
comment on column provider_profiles.claimed_at is 'When the provider claimed their account. NULL = pending invite.';

create index idx_provider_profiles_organization_id on provider_profiles(organization_id);
create index idx_provider_profiles_email on provider_profiles(email);

create trigger provider_profiles_updated_at
  before update on provider_profiles
  for each row
  execute function update_updated_at_column();

alter table provider_profiles enable row level security;

-- =============================================================================
-- SECURITY HELPER FUNCTIONS
-- =============================================================================
-- These functions use SECURITY DEFINER to bypass RLS and safely check user context

-- Get the current user's organization_id from provider_profiles
create or replace function get_user_organization_id()
returns uuid as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from provider_profiles
  where id = auth.uid();
  return v_org_id;
end;
$$ language plpgsql security definer stable;

-- Check if current user is an admin
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

-- Get admin's organization_id (returns NULL if not admin)
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

-- Check if a provider profile exists for an email (for pre-auth validation)
create or replace function provider_exists_for_email(check_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from provider_profiles
    where lower(email) = lower(check_email)
  );
end;
$$;

grant execute on function provider_exists_for_email(text) to anon;
grant execute on function provider_exists_for_email(text) to authenticated;

comment on function provider_exists_for_email(text) is 'Check if a provider profile exists for the given email. Used during auth flow.';

-- =============================================================================
-- AUTH TRIGGER
-- =============================================================================
-- When a user signs up, link them to an existing pending profile or create one

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
    -- Only create new profile if organization_id is provided (admin signup flow)
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

-- Create trigger on auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- =============================================================================
-- ORGANIZATIONS RLS POLICIES
-- =============================================================================

create policy "Providers can view their own organization"
  on organizations
  for select
  to authenticated
  using (id = get_user_organization_id());

create policy "Admins can update own org"
  on organizations
  for update
  to authenticated
  using (id = get_admin_organization_id())
  with check (id = get_admin_organization_id());

-- =============================================================================
-- PROVIDER PROFILES RLS POLICIES
-- =============================================================================

-- Users can view their own profile
create policy "Users can view their own profile"
  on provider_profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Users can update their own profile
create policy "Users can update their own profile"
  on provider_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can view all profiles in their organization
create policy "Admins can view organization profiles"
  on provider_profiles
  for select
  to authenticated
  using (
    organization_id = get_user_organization_id()
    and is_admin()
  );

-- Service role can insert new profiles (for trigger)
create policy "Service role can insert profiles"
  on provider_profiles
  for insert
  to service_role
  with check (true);

-- Admins can insert new providers in their organization
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

-- =============================================================================
-- ACTION PLANS
-- =============================================================================
-- Base table for well-being action plans

create table action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  provider_id uuid references provider_profiles(id),
  patient_mrn text,
  patient_nickname text,
  status text default 'draft' check (status in ('draft', 'active', 'archived')),
  happy_when text,
  happy_because text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  archived_at timestamp with time zone
);

comment on table action_plans is 'Well-being action plans for patients';
comment on column action_plans.organization_id is 'Organization that owns this plan (for RLS)';
comment on column action_plans.provider_id is 'Provider who created/owns this action plan';
comment on column action_plans.patient_mrn is 'Optional patient medical record number';
comment on column action_plans.patient_nickname is 'Optional patient nickname for provider reference';
comment on column action_plans.status is 'Plan status: draft, active, or archived';
comment on column action_plans.happy_when is 'Reflective question: I feel happy when...';
comment on column action_plans.happy_because is 'Reflective question: I can tell I am feeling happy because...';

create index idx_action_plans_organization_id on action_plans(organization_id);
create index idx_action_plans_provider_id on action_plans(provider_id);
create index idx_action_plans_created_by on action_plans(created_by);
create index idx_action_plans_status on action_plans(status);

create trigger action_plans_updated_at
  before update on action_plans
  for each row
  execute function update_updated_at_column();

alter table action_plans enable row level security;

-- RLS Policies for action_plans (using provider_profiles lookup)
create policy "Providers can view their organization's plans"
  on action_plans
  for select
  to authenticated
  using (organization_id = get_user_organization_id());

create policy "Providers can create plans for their organization"
  on action_plans
  for insert
  to authenticated
  with check (organization_id = get_user_organization_id());

create policy "Providers can update their organization's plans"
  on action_plans
  for update
  to authenticated
  using (organization_id = get_user_organization_id())
  with check (organization_id = get_user_organization_id());

-- =============================================================================
-- ACTION PLAN REVISIONS
-- =============================================================================
-- Versioned snapshots of action plan content

create table action_plan_revisions (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  version integer not null default 1,
  plan_payload jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  constraint unique_plan_version unique (action_plan_id, version)
);

comment on table action_plan_revisions is 'Versioned snapshots of action plan content';
comment on column action_plan_revisions.plan_payload is 'JSONB containing full plan: patientNickname, skills, supportiveAdults, helpMethods, crisisResources';
comment on column action_plan_revisions.version is 'Incrementing version number per action plan';

create index idx_action_plan_revisions_action_plan_id on action_plan_revisions(action_plan_id);
create index idx_action_plan_revisions_created_at on action_plan_revisions(created_at desc);

alter table action_plan_revisions enable row level security;

-- Helper function to get next version number
create or replace function get_next_revision_version(p_action_plan_id uuid)
returns integer as $$
declare
  next_version integer;
begin
  select coalesce(max(version), 0) + 1
  into next_version
  from action_plan_revisions
  where action_plan_id = p_action_plan_id;
  return next_version;
end;
$$ language plpgsql security definer;

-- RLS Policies for action_plan_revisions
create policy "Providers can view their organization's plan revisions"
  on action_plan_revisions
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_revisions.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Providers can create revisions for their organization's plans"
  on action_plan_revisions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_revisions.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

-- =============================================================================
-- ACTION PLAN INSTALL TOKENS
-- =============================================================================
-- Short-lived tokens for distributing plans to patients

create table action_plan_install_tokens (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  revision_id uuid references action_plan_revisions(id) on delete cascade not null,
  token text unique not null,
  purpose text not null check (purpose in ('install', 'update')),
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

comment on table action_plan_install_tokens is 'Short-lived tokens for patient plan distribution';
comment on column action_plan_install_tokens.token is 'nanoid token (8-10 chars, URL-safe) for manual entry';
comment on column action_plan_install_tokens.purpose is 'Token purpose: install (first time) or update (new revision)';
comment on column action_plan_install_tokens.used_at is 'Timestamp when token was first used (null if unused)';
comment on column action_plan_install_tokens.revoked_at is 'Timestamp when token was revoked (null if active)';

create unique index idx_action_plan_install_tokens_token on action_plan_install_tokens(token);
create index idx_action_plan_install_tokens_action_plan_id on action_plan_install_tokens(action_plan_id);
create index idx_action_plan_install_tokens_expires_at on action_plan_install_tokens(expires_at);

alter table action_plan_install_tokens enable row level security;

-- RLS Policies for action_plan_install_tokens
-- Public can SELECT by token value (for validation)
create policy "Public can validate tokens by value"
  on action_plan_install_tokens
  for select
  to anon
  using (true);

create policy "Providers can view their organization's tokens"
  on action_plan_install_tokens
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Providers can create tokens for their organization's plans"
  on action_plan_install_tokens
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Providers can update their organization's tokens"
  on action_plan_install_tokens
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

-- Allow anon to update used_at (for marking token as used during install)
create policy "Public can mark tokens as used"
  on action_plan_install_tokens
  for update
  to anon
  using (revoked_at is null)
  with check (revoked_at is null);

-- =============================================================================
-- ACTION PLAN INSTALLS
-- =============================================================================
-- Tracks when plans are installed on patient devices

create table action_plan_installs (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  revision_id uuid references action_plan_revisions(id) on delete cascade not null,
  install_token_id uuid references action_plan_install_tokens(id) on delete set null,
  device_install_id text,
  user_agent text,
  installed_at timestamp with time zone default now()
);

comment on table action_plan_installs is 'Tracks plan installations on patient devices';
comment on column action_plan_installs.device_install_id is 'Client-generated UUID to identify unique devices';
comment on column action_plan_installs.user_agent is 'Browser user agent string for analytics';

create index idx_action_plan_installs_action_plan_id on action_plan_installs(action_plan_id);
create index idx_action_plan_installs_revision_id on action_plan_installs(revision_id);
create index idx_action_plan_installs_installed_at on action_plan_installs(installed_at desc);
create index idx_action_plan_installs_device_install_id on action_plan_installs(device_install_id);

alter table action_plan_installs enable row level security;

-- RLS Policies for action_plan_installs
create policy "Public can create install records"
  on action_plan_installs
  for insert
  to anon
  with check (
    exists (
      select 1 from action_plan_install_tokens t
      where t.id = action_plan_installs.install_token_id
      and t.action_plan_id = action_plan_installs.action_plan_id
      and t.revision_id = action_plan_installs.revision_id
      and t.revoked_at is null
      and t.expires_at > now()
    )
  );

create policy "Providers can view their organization's installs"
  on action_plan_installs
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_installs.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

-- =============================================================================
-- ANONYMOUS ACCESS TO REVISIONS VIA TOKENS
-- =============================================================================

create policy "Public can view revisions via valid token"
  on action_plan_revisions
  for select
  to anon
  using (
    exists (
      select 1 from action_plan_install_tokens t
      where t.revision_id = action_plan_revisions.id
      and t.revoked_at is null
      and t.expires_at > now()
    )
  );

-- =============================================================================
-- SKILLS (Green Zone)
-- =============================================================================
-- Green Zone coping strategies/skills

create table skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  title text not null,
  category text,
  has_fill_in boolean default false,
  fill_in_prompt text,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

comment on table skills is 'Green Zone coping strategies that patients can select for their action plans';
comment on column skills.organization_id is 'Organization that owns this skill. NULL means global/seed data available to all orgs';
comment on column skills.title is 'Display title of the skill';
comment on column skills.category is 'Skill category: physical, creative, social, mindfulness, etc.';
comment on column skills.has_fill_in is 'Whether this skill has a fill-in-the-blank component';
comment on column skills.fill_in_prompt is 'The prompt text with blank for fill-in skills';
comment on column skills.display_order is 'Order for display in UI';
comment on column skills.is_active is 'Whether this skill is available for selection';

create index idx_skills_organization_id on skills(organization_id);
create index idx_skills_category on skills(category);
create index idx_skills_display_order on skills(display_order);

alter table skills enable row level security;

-- RLS Policies for skills
create policy "Users can view global and own org skills"
  on skills
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = get_user_organization_id()
  );

create policy "Providers can create skills for their org"
  on skills
  for insert
  to authenticated
  with check (organization_id = get_user_organization_id());

create policy "Providers can update their org skills"
  on skills
  for update
  to authenticated
  using (organization_id = get_user_organization_id())
  with check (organization_id = get_user_organization_id());

create policy "Providers can delete their org skills"
  on skills
  for delete
  to authenticated
  using (organization_id = get_user_organization_id());

-- =============================================================================
-- SUPPORTIVE ADULT TYPES
-- =============================================================================
-- Types of supportive adults patients can identify

create table supportive_adult_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  label text not null,
  has_fill_in boolean default false,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

comment on table supportive_adult_types is 'Types of supportive adults that patients can identify in their action plans';
comment on column supportive_adult_types.organization_id is 'Organization that owns this type. NULL means global/seed data available to all orgs';
comment on column supportive_adult_types.label is 'Display label for the adult type (e.g., Parent/guardian, Teacher)';
comment on column supportive_adult_types.has_fill_in is 'Whether this type requires a name/details fill-in';
comment on column supportive_adult_types.display_order is 'Order for display in UI';
comment on column supportive_adult_types.is_active is 'Whether this type is available for selection';

create index idx_supportive_adult_types_organization_id on supportive_adult_types(organization_id);
create index idx_supportive_adult_types_display_order on supportive_adult_types(display_order);

alter table supportive_adult_types enable row level security;

-- RLS Policies for supportive_adult_types
create policy "Users can view global and own org adult types"
  on supportive_adult_types
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = get_user_organization_id()
  );

create policy "Providers can create adult types for their org"
  on supportive_adult_types
  for insert
  to authenticated
  with check (organization_id = get_user_organization_id());

create policy "Providers can update their org adult types"
  on supportive_adult_types
  for update
  to authenticated
  using (organization_id = get_user_organization_id())
  with check (organization_id = get_user_organization_id());

create policy "Providers can delete their org adult types"
  on supportive_adult_types
  for delete
  to authenticated
  using (organization_id = get_user_organization_id());

-- =============================================================================
-- HELP METHODS (Yellow Zone)
-- =============================================================================
-- Yellow Zone help methods/strategies

create table help_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  title text not null,
  description text,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

comment on table help_methods is 'Yellow Zone help methods that patients can select when needing additional support';
comment on column help_methods.organization_id is 'Organization that owns this method. NULL means global/seed data available to all orgs';
comment on column help_methods.title is 'Display title of the help method';
comment on column help_methods.description is 'Additional description or instructions for the method';
comment on column help_methods.display_order is 'Order for display in UI';
comment on column help_methods.is_active is 'Whether this method is available for selection';

create index idx_help_methods_organization_id on help_methods(organization_id);
create index idx_help_methods_display_order on help_methods(display_order);

alter table help_methods enable row level security;

-- RLS Policies for help_methods
create policy "Users can view global and own org help methods"
  on help_methods
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = get_user_organization_id()
  );

create policy "Providers can create help methods for their org"
  on help_methods
  for insert
  to authenticated
  with check (organization_id = get_user_organization_id());

create policy "Providers can update their org help methods"
  on help_methods
  for update
  to authenticated
  using (organization_id = get_user_organization_id())
  with check (organization_id = get_user_organization_id());

create policy "Providers can delete their org help methods"
  on help_methods
  for delete
  to authenticated
  using (organization_id = get_user_organization_id());

-- =============================================================================
-- CRISIS RESOURCES (Red Zone)
-- =============================================================================
-- Red Zone crisis resources/contacts

create table crisis_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  contact text not null,
  contact_type text check (contact_type in ('phone', 'text', 'website')),
  description text,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

comment on table crisis_resources is 'Red Zone crisis resources and emergency contacts';
comment on column crisis_resources.organization_id is 'Organization that owns this resource. NULL means global/seed data available to all orgs';
comment on column crisis_resources.name is 'Display name of the crisis resource';
comment on column crisis_resources.contact is 'Contact information: phone number, text code, or URL';
comment on column crisis_resources.contact_type is 'Type of contact: phone, text, or website';
comment on column crisis_resources.description is 'Additional description or instructions';
comment on column crisis_resources.display_order is 'Order for display in UI';
comment on column crisis_resources.is_active is 'Whether this resource is available for selection';

create index idx_crisis_resources_organization_id on crisis_resources(organization_id);
create index idx_crisis_resources_display_order on crisis_resources(display_order);
create index idx_crisis_resources_contact_type on crisis_resources(contact_type);

alter table crisis_resources enable row level security;

-- RLS Policies for crisis_resources
create policy "Users can view global and own org crisis resources"
  on crisis_resources
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = get_user_organization_id()
  );

create policy "Providers can create crisis resources for their org"
  on crisis_resources
  for insert
  to authenticated
  with check (organization_id = get_user_organization_id());

create policy "Providers can update their org crisis resources"
  on crisis_resources
  for update
  to authenticated
  using (organization_id = get_user_organization_id())
  with check (organization_id = get_user_organization_id());

create policy "Providers can delete their org crisis resources"
  on crisis_resources
  for delete
  to authenticated
  using (organization_id = get_user_organization_id());

-- =============================================================================
-- ACTION PLAN JOIN TABLES
-- =============================================================================

-- Action Plan Skills (Green Zone selections)
create table action_plan_skills (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  skill_id uuid references skills(id),
  additional_info text,
  is_custom boolean default false,
  display_order int default 0,
  created_at timestamp with time zone default now()
);

comment on table action_plan_skills is 'Join table linking action plans to selected skills';
comment on column action_plan_skills.skill_id is 'Reference to skills table, null for custom skills';
comment on column action_plan_skills.additional_info is 'Fill-in value for skills with prompts, or custom skill text';
comment on column action_plan_skills.is_custom is 'True if this is a fully custom skill (skill_id is null)';
comment on column action_plan_skills.display_order is 'Order in which skills appear on the action plan';

create index idx_action_plan_skills_action_plan_id on action_plan_skills(action_plan_id);
create index idx_action_plan_skills_skill_id on action_plan_skills(skill_id);
create index idx_action_plan_skills_display_order on action_plan_skills(display_order);

alter table action_plan_skills enable row level security;

-- RLS for action_plan_skills
create policy "Users can view skills for their organization's action plans"
  on action_plan_skills
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can add skills to their organization's action plans"
  on action_plan_skills
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can update skills on their organization's action plans"
  on action_plan_skills
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can remove skills from their organization's action plans"
  on action_plan_skills
  for delete
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

-- Action Plan Supportive Adults
create table action_plan_supportive_adults (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  supportive_adult_type_id uuid references supportive_adult_types(id),
  name text,
  contact_info text,
  is_primary boolean default false,
  is_custom boolean default false,
  display_order int default 0,
  created_at timestamp with time zone default now()
);

comment on table action_plan_supportive_adults is 'Join table linking action plans to supportive adults';
comment on column action_plan_supportive_adults.supportive_adult_type_id is 'Reference to supportive_adult_types table, null for custom types';
comment on column action_plan_supportive_adults.name is 'The specific person''s name';
comment on column action_plan_supportive_adults.contact_info is 'Optional phone number or email for the supportive adult';
comment on column action_plan_supportive_adults.is_primary is 'True if this is the primary supportive adult';
comment on column action_plan_supportive_adults.is_custom is 'True if this is a custom type (supportive_adult_type_id is null)';
comment on column action_plan_supportive_adults.display_order is 'Order in which supportive adults appear on the action plan';

create index idx_action_plan_supportive_adults_action_plan_id on action_plan_supportive_adults(action_plan_id);
create index idx_action_plan_supportive_adults_type_id on action_plan_supportive_adults(supportive_adult_type_id);
create index idx_action_plan_supportive_adults_display_order on action_plan_supportive_adults(display_order);
create index idx_action_plan_supportive_adults_is_primary on action_plan_supportive_adults(is_primary) where is_primary = true;

alter table action_plan_supportive_adults enable row level security;

-- RLS for action_plan_supportive_adults
create policy "Users can view supportive adults for their organization's action plans"
  on action_plan_supportive_adults
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can add supportive adults to their organization's action plans"
  on action_plan_supportive_adults
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can update supportive adults on their organization's action plans"
  on action_plan_supportive_adults
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can remove supportive adults from their organization's action plans"
  on action_plan_supportive_adults
  for delete
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

-- Action Plan Help Methods (Yellow Zone selections)
create table action_plan_help_methods (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  help_method_id uuid references help_methods(id),
  additional_info text,
  is_custom boolean default false,
  display_order int default 0,
  created_at timestamp with time zone default now()
);

comment on table action_plan_help_methods is 'Join table linking action plans to help methods (Yellow Zone)';
comment on column action_plan_help_methods.help_method_id is 'Reference to help_methods table, null for custom methods';
comment on column action_plan_help_methods.additional_info is 'Custom text, notes, or fill-in values';
comment on column action_plan_help_methods.is_custom is 'True if this is a fully custom help method (help_method_id is null)';
comment on column action_plan_help_methods.display_order is 'Order in which help methods appear on the action plan';

create index idx_action_plan_help_methods_action_plan_id on action_plan_help_methods(action_plan_id);
create index idx_action_plan_help_methods_help_method_id on action_plan_help_methods(help_method_id);
create index idx_action_plan_help_methods_display_order on action_plan_help_methods(display_order);

alter table action_plan_help_methods enable row level security;

-- RLS for action_plan_help_methods
create policy "Users can view help methods for their organization's action plans"
  on action_plan_help_methods
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can add help methods to their organization's action plans"
  on action_plan_help_methods
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can update help methods on their organization's action plans"
  on action_plan_help_methods
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

create policy "Users can remove help methods from their organization's action plans"
  on action_plan_help_methods
  for delete
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = get_user_organization_id()
    )
  );

-- =============================================================================
-- TOKEN VALIDATION FUNCTIONS
-- =============================================================================

-- Create custom type for token validation result
create type token_validation_status as enum (
  'valid',
  'expired',
  'used',
  'revoked',
  'update_expired',
  'not_found'
);

-- Validate tokens and return plan data
create or replace function validate_install_token(p_token text)
returns table (
  status token_validation_status,
  token_id uuid,
  action_plan_id uuid,
  revision_id uuid,
  revision_version integer,
  plan_payload jsonb,
  purpose text,
  expires_at timestamp with time zone,
  used_at timestamp with time zone
) as $$
declare
  v_token record;
  v_revision record;
begin
  -- Look up the token
  select t.*
  into v_token
  from action_plan_install_tokens t
  where t.token = p_token;

  -- Token not found
  if not found then
    return query select
      'not_found'::token_validation_status,
      null::uuid, null::uuid, null::uuid, null::integer, null::jsonb,
      null::text, null::timestamp with time zone, null::timestamp with time zone;
    return;
  end if;

  -- Token was revoked
  if v_token.revoked_at is not null then
    return query select
      'revoked'::token_validation_status,
      v_token.id, v_token.action_plan_id, v_token.revision_id, null::integer, null::jsonb,
      v_token.purpose, v_token.expires_at, v_token.used_at;
    return;
  end if;

  -- Token expired
  if v_token.expires_at < now() then
    if v_token.purpose = 'update' then
      return query select
        'update_expired'::token_validation_status,
        v_token.id, v_token.action_plan_id, v_token.revision_id, null::integer, null::jsonb,
        v_token.purpose, v_token.expires_at, v_token.used_at;
    else
      return query select
        'expired'::token_validation_status,
        v_token.id, v_token.action_plan_id, v_token.revision_id, null::integer, null::jsonb,
        v_token.purpose, v_token.expires_at, v_token.used_at;
    end if;
    return;
  end if;

  -- Token already used (for install tokens only - update tokens can be reused)
  if v_token.used_at is not null and v_token.purpose = 'install' then
    return query select
      'used'::token_validation_status,
      v_token.id, v_token.action_plan_id, v_token.revision_id, null::integer, null::jsonb,
      v_token.purpose, v_token.expires_at, v_token.used_at;
    return;
  end if;

  -- Token is valid - fetch the revision data
  select r.id, r.version, r.plan_payload
  into v_revision
  from action_plan_revisions r
  where r.id = v_token.revision_id;

  if not found then
    return query select
      'not_found'::token_validation_status,
      v_token.id, v_token.action_plan_id, v_token.revision_id, null::integer, null::jsonb,
      v_token.purpose, v_token.expires_at, v_token.used_at;
    return;
  end if;

  -- Return valid token with plan data
  return query select
    'valid'::token_validation_status,
    v_token.id, v_token.action_plan_id, v_token.revision_id, v_revision.version,
    v_revision.plan_payload, v_token.purpose, v_token.expires_at, v_token.used_at;
end;
$$ language plpgsql security definer;

grant execute on function validate_install_token(text) to anon;
grant execute on function validate_install_token(text) to authenticated;

comment on function validate_install_token(text) is 'Validates an install token and returns status, plan payload, and revision info';

-- Helper function to mark a token as used
create or replace function mark_token_used(p_token text)
returns boolean as $$
declare
  v_updated boolean := false;
begin
  update action_plan_install_tokens
  set used_at = now()
  where token = p_token
    and used_at is null
    and revoked_at is null
    and expires_at > now();

  v_updated := found;
  return v_updated;
end;
$$ language plpgsql security definer;

grant execute on function mark_token_used(text) to anon;
grant execute on function mark_token_used(text) to authenticated;

comment on function mark_token_used(text) is 'Marks an install token as used (idempotent for install tokens)';

-- Helper function for creating install records
create or replace function create_install_record(
  p_token text,
  p_device_install_id text default null,
  p_user_agent text default null
)
returns uuid as $$
declare
  v_token record;
  v_install_id uuid;
begin
  -- Validate the token first
  select t.*
  into v_token
  from action_plan_install_tokens t
  where t.token = p_token
    and t.revoked_at is null
    and t.expires_at > now();

  if not found then
    raise exception 'Invalid or expired token';
  end if;

  -- Create the install record
  insert into action_plan_installs (
    action_plan_id,
    revision_id,
    install_token_id,
    device_install_id,
    user_agent
  ) values (
    v_token.action_plan_id,
    v_token.revision_id,
    v_token.id,
    p_device_install_id,
    p_user_agent
  )
  returning id into v_install_id;

  -- Mark the token as used (for install tokens)
  if v_token.purpose = 'install' then
    update action_plan_install_tokens
    set used_at = now()
    where id = v_token.id
      and used_at is null;
  end if;

  return v_install_id;
end;
$$ language plpgsql security definer;

grant execute on function create_install_record(text, text, text) to anon;
grant execute on function create_install_record(text, text, text) to authenticated;

comment on function create_install_record(text, text, text) is 'Creates an install record and marks the token as used (atomic operation)';

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
