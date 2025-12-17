-- Migration: Create crisis_resources table
-- Description: Red Zone crisis resources/contacts

create table if not exists crisis_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id), -- null = global seed
  name text not null,
  contact text not null, -- phone number or text code
  contact_type text check (contact_type in ('phone', 'text', 'website')),
  description text,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table crisis_resources is 'Red Zone crisis resources and emergency contacts';
comment on column crisis_resources.organization_id is 'Organization that owns this resource. NULL means global/seed data available to all orgs';
comment on column crisis_resources.name is 'Display name of the crisis resource';
comment on column crisis_resources.contact is 'Contact information: phone number, text code, or URL';
comment on column crisis_resources.contact_type is 'Type of contact: phone, text, or website';
comment on column crisis_resources.description is 'Additional description or instructions';
comment on column crisis_resources.display_order is 'Order for display in UI';
comment on column crisis_resources.is_active is 'Whether this resource is available for selection';

-- Create indexes
create index if not exists idx_crisis_resources_organization_id on crisis_resources(organization_id);
create index if not exists idx_crisis_resources_display_order on crisis_resources(display_order);
create index if not exists idx_crisis_resources_contact_type on crisis_resources(contact_type);

-- Enable RLS
alter table crisis_resources enable row level security;

-- RLS Policy: Anyone can read global resources (org_id is null) or their org's resources
create policy "Users can view global and own org crisis resources"
  on crisis_resources
  for select
  to authenticated
  using (
    organization_id is null
    or organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can insert resources for their own organization only
create policy "Providers can create crisis resources for their org"
  on crisis_resources
  for insert
  to authenticated
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can update their own organization's resources
create policy "Providers can update their org crisis resources"
  on crisis_resources
  for update
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  )
  with check (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- RLS Policy: Providers can delete their own organization's resources
create policy "Providers can delete their org crisis resources"
  on crisis_resources
  for delete
  to authenticated
  using (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
