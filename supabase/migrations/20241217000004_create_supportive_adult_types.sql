-- Migration: Create supportive_adult_types table
-- Description: Types of supportive adults patients can identify

create table if not exists supportive_adult_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id), -- null = global seed
  label text not null, -- e.g., "Parent/guardian", "Grandparent"
  has_fill_in boolean default false, -- most have a name field
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table supportive_adult_types is 'Types of supportive adults that patients can identify in their action plans';
comment on column supportive_adult_types.organization_id is 'Organization that owns this type. NULL means global/seed data available to all orgs';
comment on column supportive_adult_types.label is 'Display label for the adult type (e.g., Parent/guardian, Teacher)';
comment on column supportive_adult_types.has_fill_in is 'Whether this type requires a name/details fill-in';
comment on column supportive_adult_types.display_order is 'Order for display in UI';
comment on column supportive_adult_types.is_active is 'Whether this type is available for selection';

-- Create indexes
create index if not exists idx_supportive_adult_types_organization_id on supportive_adult_types(organization_id);
create index if not exists idx_supportive_adult_types_display_order on supportive_adult_types(display_order);

-- Enable RLS
alter table supportive_adult_types enable row level security;

-- RLS Policy: Anyone can read global types (org_id is null) or their org's types
create policy "Users can view global and own org adult types"
  on supportive_adult_types
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can insert types for their own organization only
create policy "Providers can create adult types for their org"
  on supportive_adult_types
  for insert
  to authenticated
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can update their own organization's types
create policy "Providers can update their org adult types"
  on supportive_adult_types
  for update
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  )
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can delete their own organization's types
create policy "Providers can delete their org adult types"
  on supportive_adult_types
  for delete
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
