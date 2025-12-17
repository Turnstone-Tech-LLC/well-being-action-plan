-- Migration: Create action_plan_revisions table
-- Description: Stores versioned snapshots of action plan content

create table if not exists action_plan_revisions (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  version integer not null default 1,
  plan_payload jsonb not null,  -- Full plan content (skills, adults, crisis resources, etc.)
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),

  -- Ensure version numbers are unique per plan
  constraint unique_plan_version unique (action_plan_id, version)
);

-- Add comments for documentation
comment on table action_plan_revisions is 'Versioned snapshots of action plan content';
comment on column action_plan_revisions.plan_payload is 'JSONB containing full plan: patientNickname, skills, supportiveAdults, helpMethods, crisisResources';
comment on column action_plan_revisions.version is 'Incrementing version number per action plan';

-- Indexes
create index if not exists idx_action_plan_revisions_action_plan_id
  on action_plan_revisions(action_plan_id);
create index if not exists idx_action_plan_revisions_created_at
  on action_plan_revisions(created_at desc);

-- Enable RLS
alter table action_plan_revisions enable row level security;

-- RLS Policy: Providers can view revisions for their organization's plans
create policy "Providers can view their organization's plan revisions"
  on action_plan_revisions
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_revisions.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- RLS Policy: Providers can create revisions for their organization's plans
create policy "Providers can create revisions for their organization's plans"
  on action_plan_revisions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_revisions.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- RLS Policy: Allow anonymous SELECT via valid token (for patient access)
-- This policy allows unauthenticated users to read revision data
-- only when accessed through a valid install token
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
      -- Note: We don't check used_at here because patients need to re-download
      -- even after initial install (e.g., on a new device)
    )
  );

-- Function to get next version number for a plan
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
