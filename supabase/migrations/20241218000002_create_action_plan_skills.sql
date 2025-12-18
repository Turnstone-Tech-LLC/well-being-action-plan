-- Migration: Create action_plan_skills join table
-- Description: Links action plans to skills (Green Zone coping strategies)

-- Create action_plan_skills table
create table if not exists action_plan_skills (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade not null,
  skill_id uuid references skills(id),  -- null if fully custom
  additional_info text,                  -- fill-in value or custom skill text
  is_custom boolean default false,       -- true if skill_id is null
  display_order int default 0,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table action_plan_skills is 'Join table linking action plans to selected skills';
comment on column action_plan_skills.skill_id is 'Reference to skills table, null for custom skills';
comment on column action_plan_skills.additional_info is 'Fill-in value for skills with prompts, or custom skill text';
comment on column action_plan_skills.is_custom is 'True if this is a fully custom skill (skill_id is null)';
comment on column action_plan_skills.display_order is 'Order in which skills appear on the action plan';

-- Create indexes for foreign key lookups
create index if not exists idx_action_plan_skills_action_plan_id on action_plan_skills(action_plan_id);
create index if not exists idx_action_plan_skills_skill_id on action_plan_skills(skill_id);
create index if not exists idx_action_plan_skills_display_order on action_plan_skills(display_order);

-- Enable Row Level Security
alter table action_plan_skills enable row level security;

-- RLS Policy: Inherit access from parent action_plan
-- SELECT: Can view if user can view the parent action plan
create policy "Users can view skills for their organization's action plans"
  on action_plan_skills
  for select
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- INSERT: Can insert if user can manage the parent action plan
create policy "Users can add skills to their organization's action plans"
  on action_plan_skills
  for insert
  to authenticated
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- UPDATE: Can update if user can manage the parent action plan
create policy "Users can update skills on their organization's action plans"
  on action_plan_skills
  for update
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  )
  with check (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );

-- DELETE: Can delete if user can manage the parent action plan
create policy "Users can remove skills from their organization's action plans"
  on action_plan_skills
  for delete
  to authenticated
  using (
    exists (
      select 1 from action_plans ap
      where ap.id = action_plan_skills.action_plan_id
      and ap.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    )
  );
