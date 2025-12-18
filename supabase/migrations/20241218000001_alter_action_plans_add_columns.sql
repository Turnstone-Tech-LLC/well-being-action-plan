-- Migration: Alter action_plans to add reflective questions and provider columns
-- Description: Adds provider_id, patient_nickname, status, and reflective question fields

-- Add provider_id column with foreign key to provider_profiles
alter table action_plans
  add column if not exists provider_id uuid references provider_profiles(id);

-- Add patient_nickname column (optional, for provider reference)
alter table action_plans
  add column if not exists patient_nickname text;

-- Add status column with check constraint
alter table action_plans
  add column if not exists status text default 'draft';

-- Add check constraint for status values
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'action_plans_status_check'
  ) then
    alter table action_plans
      add constraint action_plans_status_check
      check (status in ('draft', 'active', 'archived'));
  end if;
end;
$$;

-- Add reflective question columns (from WBAP card)
alter table action_plans
  add column if not exists happy_when text;

alter table action_plans
  add column if not exists happy_because text;

-- Add index for provider_id lookups
create index if not exists idx_action_plans_provider_id on action_plans(provider_id);

-- Add index for status filtering
create index if not exists idx_action_plans_status on action_plans(status);

-- Add comments for documentation
comment on column action_plans.provider_id is 'Provider who created/owns this action plan';
comment on column action_plans.patient_nickname is 'Optional patient nickname for provider reference';
comment on column action_plans.status is 'Plan status: draft, active, or archived';
comment on column action_plans.happy_when is 'Reflective question: I feel happy when...';
comment on column action_plans.happy_because is 'Reflective question: I can tell I am feeling happy because...';
