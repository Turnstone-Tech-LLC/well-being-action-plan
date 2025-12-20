-- Migration: Create action_plan_installs table
-- Description: Tracks when plans are installed on patient devices

create table if not exists action_plan_installs (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  revision_id uuid references action_plan_revisions(id) on delete cascade not null,
  install_token_id uuid references action_plan_install_tokens(id) on delete set null,
  device_install_id text,   -- Client-generated ID to track unique device installations
  user_agent text,          -- Browser/device info for analytics
  installed_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table action_plan_installs is 'Tracks plan installations on patient devices';
comment on column action_plan_installs.device_install_id is 'Client-generated UUID to identify unique devices';
comment on column action_plan_installs.user_agent is 'Browser user agent string for analytics';

-- Indexes (as specified in the issue)
create index if not exists idx_action_plan_installs_action_plan_id
  on action_plan_installs(action_plan_id);
create index if not exists idx_action_plan_installs_revision_id
  on action_plan_installs(revision_id);
create index if not exists idx_action_plan_installs_installed_at
  on action_plan_installs(installed_at desc);
create index if not exists idx_action_plan_installs_device_install_id
  on action_plan_installs(device_install_id);

-- Enable RLS
alter table action_plan_installs enable row level security;

-- RLS Policy: Public can INSERT (for tracking installs from unauthenticated patients)
-- This is critical for the install flow where patients aren't logged in
create policy "Public can create install records"
  on action_plan_installs
  for insert
  to anon
  with check (
    -- Can only create install record if there's a valid token
    exists (
      select 1 from action_plan_install_tokens t
      where t.id = action_plan_installs.install_token_id
      and t.action_plan_id = action_plan_installs.action_plan_id
      and t.revision_id = action_plan_installs.revision_id
      and t.revoked_at is null
      and t.expires_at > now()
    )
  );

-- RLS Policy: Providers can view installs for their organization's plans
create policy "Providers can view their organization's installs"
  on action_plan_installs
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_installs.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );
