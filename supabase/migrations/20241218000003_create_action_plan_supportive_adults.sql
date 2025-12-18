-- Migration: Create action_plan_supportive_adults join table
-- Description: Links action plans to supportive adults

-- Create action_plan_supportive_adults table
create table if not exists action_plan_supportive_adults (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  supportive_adult_type_id uuid references supportive_adult_types(id),  -- null if custom
  name text,                             -- the specific person's name
  contact_info text,                     -- optional phone/email
  is_primary boolean default false,      -- the main supportive adult
  is_custom boolean default false,       -- true if type_id is null
  display_order int default 0,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table action_plan_supportive_adults is 'Join table linking action plans to supportive adults';
comment on column action_plan_supportive_adults.supportive_adult_type_id is 'Reference to supportive_adult_types table, null for custom types';
comment on column action_plan_supportive_adults.name is 'The specific person''s name';
comment on column action_plan_supportive_adults.contact_info is 'Optional phone number or email for the supportive adult';
comment on column action_plan_supportive_adults.is_primary is 'True if this is the primary supportive adult';
comment on column action_plan_supportive_adults.is_custom is 'True if this is a custom type (supportive_adult_type_id is null)';
comment on column action_plan_supportive_adults.display_order is 'Order in which supportive adults appear on the action plan';

-- Create indexes for foreign key lookups
create index if not exists idx_action_plan_supportive_adults_action_plan_id on action_plan_supportive_adults(action_plan_id);
create index if not exists idx_action_plan_supportive_adults_type_id on action_plan_supportive_adults(supportive_adult_type_id);
create index if not exists idx_action_plan_supportive_adults_display_order on action_plan_supportive_adults(display_order);
create index if not exists idx_action_plan_supportive_adults_is_primary on action_plan_supportive_adults(is_primary) where is_primary = true;

-- Enable Row Level Security
alter table action_plan_supportive_adults enable row level security;

-- RLS Policy: Inherit access from parent action_plan
-- SELECT: Can view if user can view the parent action plan
create policy "Users can view supportive adults for their organization's action plans"
  on action_plan_supportive_adults
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- INSERT: Can insert if user can manage the parent action plan
create policy "Users can add supportive adults to their organization's action plans"
  on action_plan_supportive_adults
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- UPDATE: Can update if user can manage the parent action plan
create policy "Users can update supportive adults on their organization's action plans"
  on action_plan_supportive_adults
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- DELETE: Can delete if user can manage the parent action plan
create policy "Users can remove supportive adults from their organization's action plans"
  on action_plan_supportive_adults
  for delete
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_supportive_adults.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );
