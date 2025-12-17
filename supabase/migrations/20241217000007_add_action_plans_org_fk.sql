-- Migration: Add foreign key from action_plans to organizations
-- Description: Links action_plans.organization_id to organizations.id

-- Add foreign key constraint
-- Using ALTER TABLE to add constraint to existing table
alter table action_plans
  add constraint fk_action_plans_organization
  foreign key (organization_id)
  references organizations(id);

-- Add comment for documentation
comment on constraint fk_action_plans_organization on action_plans is 'Links action plans to their owning organization';
