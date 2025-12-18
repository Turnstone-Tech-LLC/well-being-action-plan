-- Migration: Create action_plan_help_methods join table
-- Description: Links action plans to help methods (Yellow Zone)

-- Create action_plan_help_methods table
create table if not exists action_plan_help_methods (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  help_method_id uuid references help_methods(id),  -- null if custom
  additional_info text,                              -- custom text or notes
  is_custom boolean default false,
  display_order int default 0,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table action_plan_help_methods is 'Join table linking action plans to help methods (Yellow Zone)';
comment on column action_plan_help_methods.help_method_id is 'Reference to help_methods table, null for custom methods';
comment on column action_plan_help_methods.additional_info is 'Custom text, notes, or fill-in values';
comment on column action_plan_help_methods.is_custom is 'True if this is a fully custom help method (help_method_id is null)';
comment on column action_plan_help_methods.display_order is 'Order in which help methods appear on the action plan';

-- Create indexes for foreign key lookups
create index if not exists idx_action_plan_help_methods_action_plan_id on action_plan_help_methods(action_plan_id);
create index if not exists idx_action_plan_help_methods_help_method_id on action_plan_help_methods(help_method_id);
create index if not exists idx_action_plan_help_methods_display_order on action_plan_help_methods(display_order);

-- Enable Row Level Security
alter table action_plan_help_methods enable row level security;

-- RLS Policy: Inherit access from parent action_plan
-- SELECT: Can view if user can view the parent action plan
create policy "Users can view help methods for their organization's action plans"
  on action_plan_help_methods
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- INSERT: Can insert if user can manage the parent action plan
create policy "Users can add help methods to their organization's action plans"
  on action_plan_help_methods
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- UPDATE: Can update if user can manage the parent action plan
create policy "Users can update help methods on their organization's action plans"
  on action_plan_help_methods
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- DELETE: Can delete if user can manage the parent action plan
create policy "Users can remove help methods from their organization's action plans"
  on action_plan_help_methods
  for delete
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_help_methods.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );
