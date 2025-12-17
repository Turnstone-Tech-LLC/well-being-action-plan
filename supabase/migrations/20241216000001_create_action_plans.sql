-- Migration: Create action_plans base table
-- Description: Base table for well-being action plans

-- Create action_plans table (base table referenced by revisions and tokens)
create table if not exists action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,  -- References organization for RLS
  patient_mrn text,               -- Optional medical record number
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  archived_at timestamp with time zone
);

-- Add comment for documentation
comment on table action_plans is 'Well-being action plans for patients';
comment on column action_plans.organization_id is 'Organization that owns this plan (for RLS)';
comment on column action_plans.patient_mrn is 'Optional patient medical record number';

-- Create index for organization lookups
create index if not exists idx_action_plans_organization_id on action_plans(organization_id);
create index if not exists idx_action_plans_created_by on action_plans(created_by);

-- Enable RLS
alter table action_plans enable row level security;

-- RLS Policy: Providers can only see plans from their organization
-- Note: This assumes a user_organizations table or organization_id on auth.users metadata
-- For now, we'll use a simple authenticated check - to be refined when org structure is defined
create policy "Authenticated users can view their organization's plans"
  on action_plans
  for select
  to authenticated
  using (
    -- Check if user belongs to the plan's organization
    -- This will be updated when organization membership is implemented
    organization_id in (
      select (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

create policy "Authenticated users can create plans for their organization"
  on action_plans
  for insert
  to authenticated
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

create policy "Authenticated users can update their organization's plans"
  on action_plans
  for update
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  )
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- Trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger action_plans_updated_at
  before update on action_plans
  for each row
  execute function update_updated_at_column();
