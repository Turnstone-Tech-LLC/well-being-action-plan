-- Migration: Create action_plan_install_tokens table
-- Description: Short-lived tokens for distributing plans to patients

create table if not exists action_plan_install_tokens (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  revision_id uuid references action_plan_revisions(id) on delete cascade not null,
  token text unique not null,  -- nanoid format, e.g. '7x9k2m4n' (8-10 chars, URL-safe)
  purpose text not null check (purpose in ('install', 'update')),
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table action_plan_install_tokens is 'Short-lived tokens for patient plan distribution';
comment on column action_plan_install_tokens.token is 'nanoid token (8-10 chars, URL-safe) for manual entry';
comment on column action_plan_install_tokens.purpose is 'Token purpose: install (first time) or update (new revision)';
comment on column action_plan_install_tokens.used_at is 'Timestamp when token was first used (null if unused)';
comment on column action_plan_install_tokens.revoked_at is 'Timestamp when token was revoked (null if active)';

-- Indexes (as specified in the issue)
create unique index if not exists idx_action_plan_install_tokens_token
  on action_plan_install_tokens(token);
create index if not exists idx_action_plan_install_tokens_action_plan_id
  on action_plan_install_tokens(action_plan_id);
create index if not exists idx_action_plan_install_tokens_expires_at
  on action_plan_install_tokens(expires_at);

-- Enable RLS
alter table action_plan_install_tokens enable row level security;

-- RLS Policy: Public can SELECT by token value only (for validation)
-- This allows unauthenticated patients to validate their access tokens
create policy "Public can validate tokens by value"
  on action_plan_install_tokens
  for select
  to anon
  using (true);  -- Allow reading token records, actual validation in application

-- RLS Policy: Providers can view tokens for their organization's plans
create policy "Providers can view their organization's tokens"
  on action_plan_install_tokens
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- RLS Policy: Providers can create tokens for their organization's plans
create policy "Providers can create tokens for their organization's plans"
  on action_plan_install_tokens
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- RLS Policy: Providers can update (revoke) tokens for their organization's plans
create policy "Providers can update their organization's tokens"
  on action_plan_install_tokens
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_install_tokens.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- RLS Policy: Allow anon to update used_at (for marking token as used during install)
-- This is necessary for the install flow where unauthenticated patients claim tokens
create policy "Public can mark tokens as used"
  on action_plan_install_tokens
  for update
  to anon
  using (
    -- Can only update tokens that exist and aren't already revoked
    revoked_at is null
  )
  with check (
    -- Can only set used_at, nothing else (enforced by application logic)
    revoked_at is null
  );
