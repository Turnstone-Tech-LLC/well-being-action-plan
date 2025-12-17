-- Migration: Create skills table
-- Description: Green Zone coping strategies/skills

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id), -- null = global seed
  title text not null,
  category text, -- e.g., 'physical', 'creative', 'social', 'mindfulness'
  has_fill_in boolean default false,
  fill_in_prompt text, -- e.g., "Move my body ___"
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table skills is 'Green Zone coping strategies that patients can select for their action plans';
comment on column skills.organization_id is 'Organization that owns this skill. NULL means global/seed data available to all orgs';
comment on column skills.title is 'Display title of the skill';
comment on column skills.category is 'Skill category: physical, creative, social, mindfulness, etc.';
comment on column skills.has_fill_in is 'Whether this skill has a fill-in-the-blank component';
comment on column skills.fill_in_prompt is 'The prompt text with blank for fill-in skills';
comment on column skills.display_order is 'Order for display in UI';
comment on column skills.is_active is 'Whether this skill is available for selection';

-- Create indexes
create index if not exists idx_skills_organization_id on skills(organization_id);
create index if not exists idx_skills_category on skills(category);
create index if not exists idx_skills_display_order on skills(display_order);

-- Enable RLS
alter table skills enable row level security;

-- RLS Policy: Anyone can read global skills (org_id is null) or their org's skills
create policy "Users can view global and own org skills"
  on skills
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can insert skills for their own organization only
create policy "Providers can create skills for their org"
  on skills
  for insert
  to authenticated
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can update their own organization's skills
create policy "Providers can update their org skills"
  on skills
  for update
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  )
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can delete their own organization's skills
create policy "Providers can delete their org skills"
  on skills
  for delete
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
