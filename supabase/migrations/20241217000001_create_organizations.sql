-- Migration: Create organizations table
-- Description: Base table for organizations (healthcare providers/facilities)

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  settings jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add comments for documentation
comment on table organizations is 'Healthcare organizations/facilities that use the Well-Being Action Plan system';
comment on column organizations.name is 'Display name of the organization';
comment on column organizations.slug is 'URL-friendly unique identifier';
comment on column organizations.settings is 'Organization-specific settings and configuration';

-- Create indexes
create index if not exists idx_organizations_slug on organizations(slug);

-- Enable RLS
alter table organizations enable row level security;

-- RLS Policy: Providers can read their own organization
create policy "Providers can view their own organization"
  on organizations
  for select
  to authenticated
  using (
    id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );

-- Trigger to update updated_at timestamp (reuse existing function if it exists)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'organizations_updated_at'
  ) then
    create trigger organizations_updated_at
      before update on organizations
      for each row
      execute function update_updated_at_column();
  end if;
end;
$$;
