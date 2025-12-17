-- Migration: Create help_methods table
-- Description: Yellow Zone help methods/strategies

create table if not exists help_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id), -- null = global seed
  title text not null,
  description text,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table help_methods is 'Yellow Zone help methods that patients can select when needing additional support';
comment on column help_methods.organization_id is 'Organization that owns this method. NULL means global/seed data available to all orgs';
comment on column help_methods.title is 'Display title of the help method';
comment on column help_methods.description is 'Additional description or instructions for the method';
comment on column help_methods.display_order is 'Order for display in UI';
comment on column help_methods.is_active is 'Whether this method is available for selection';

-- Create indexes
create index if not exists idx_help_methods_organization_id on help_methods(organization_id);
create index if not exists idx_help_methods_display_order on help_methods(display_order);

-- Enable RLS
alter table help_methods enable row level security;

-- RLS Policy: Anyone can read global methods (org_id is null) or their org's methods
create policy "Users can view global and own org help methods"
  on help_methods
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can insert methods for their own organization only
create policy "Providers can create help methods for their org"
  on help_methods
  for insert
  to authenticated
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can update their own organization's methods
create policy "Providers can update their org help methods"
  on help_methods
  for update
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  )
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can delete their own organization's methods
create policy "Providers can delete their org help methods"
  on help_methods
  for delete
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
