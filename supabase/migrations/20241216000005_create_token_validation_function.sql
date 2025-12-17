-- Migration: Create token validation function
-- Description: Database function for validating install tokens and returning plan data

-- Create custom type for token validation result
create type token_validation_status as enum (
  'valid',
  'expired',
  'used',
  'revoked',
  'update_expired',
  'not_found'
);

-- Create function to validate tokens and return plan data
-- This function is callable by anonymous users for the patient access flow
create or replace function validate_install_token(p_token text)
returns table (
  status token_validation_status,
  token_id uuid,
  action_plan_id uuid,
  revision_id uuid,
  revision_version integer,
  plan_payload jsonb,
  purpose text,
  expires_at timestamp with time zone,
  used_at timestamp with time zone
) as $$
declare
  v_token record;
  v_revision record;
begin
  -- Look up the token
  select t.*
  into v_token
  from action_plan_install_tokens t
  where t.token = p_token;

  -- Token not found
  if not found then
    return query select
      'not_found'::token_validation_status,
      null::uuid,
      null::uuid,
      null::uuid,
      null::integer,
      null::jsonb,
      null::text,
      null::timestamp with time zone,
      null::timestamp with time zone;
    return;
  end if;

  -- Token was revoked
  if v_token.revoked_at is not null then
    return query select
      'revoked'::token_validation_status,
      v_token.id,
      v_token.action_plan_id,
      v_token.revision_id,
      null::integer,
      null::jsonb,
      v_token.purpose,
      v_token.expires_at,
      v_token.used_at;
    return;
  end if;

  -- Token expired
  if v_token.expires_at < now() then
    -- Check if it's an update token (different status)
    if v_token.purpose = 'update' then
      return query select
        'update_expired'::token_validation_status,
        v_token.id,
        v_token.action_plan_id,
        v_token.revision_id,
        null::integer,
        null::jsonb,
        v_token.purpose,
        v_token.expires_at,
        v_token.used_at;
    else
      return query select
        'expired'::token_validation_status,
        v_token.id,
        v_token.action_plan_id,
        v_token.revision_id,
        null::integer,
        null::jsonb,
        v_token.purpose,
        v_token.expires_at,
        v_token.used_at;
    end if;
    return;
  end if;

  -- Token already used (for install tokens only - update tokens can be reused)
  if v_token.used_at is not null and v_token.purpose = 'install' then
    return query select
      'used'::token_validation_status,
      v_token.id,
      v_token.action_plan_id,
      v_token.revision_id,
      null::integer,
      null::jsonb,
      v_token.purpose,
      v_token.expires_at,
      v_token.used_at;
    return;
  end if;

  -- Token is valid - fetch the revision data
  select r.id, r.version, r.plan_payload
  into v_revision
  from action_plan_revisions r
  where r.id = v_token.revision_id;

  if not found then
    -- Revision was deleted (shouldn't happen normally)
    return query select
      'not_found'::token_validation_status,
      v_token.id,
      v_token.action_plan_id,
      v_token.revision_id,
      null::integer,
      null::jsonb,
      v_token.purpose,
      v_token.expires_at,
      v_token.used_at;
    return;
  end if;

  -- Return valid token with plan data
  return query select
    'valid'::token_validation_status,
    v_token.id,
    v_token.action_plan_id,
    v_token.revision_id,
    v_revision.version,
    v_revision.plan_payload,
    v_token.purpose,
    v_token.expires_at,
    v_token.used_at;
end;
$$ language plpgsql security definer;

-- Grant execute permission to anonymous users (for patient access)
grant execute on function validate_install_token(text) to anon;
grant execute on function validate_install_token(text) to authenticated;

-- Add comment for documentation
comment on function validate_install_token(text) is 'Validates an install token and returns status, plan payload, and revision info';

-- Create a helper function to mark a token as used
-- This is called after successful plan installation
create or replace function mark_token_used(p_token text)
returns boolean as $$
declare
  v_updated boolean := false;
begin
  update action_plan_install_tokens
  set used_at = now()
  where token = p_token
    and used_at is null
    and revoked_at is null
    and expires_at > now();

  v_updated := found;
  return v_updated;
end;
$$ language plpgsql security definer;

-- Grant execute permission to anonymous users (for install flow)
grant execute on function mark_token_used(text) to anon;
grant execute on function mark_token_used(text) to authenticated;

comment on function mark_token_used(text) is 'Marks an install token as used (idempotent for install tokens)';

-- Create a helper function for creating install records
-- This ensures proper validation before insertion
create or replace function create_install_record(
  p_token text,
  p_device_install_id text default null,
  p_user_agent text default null
)
returns uuid as $$
declare
  v_token record;
  v_install_id uuid;
begin
  -- Validate the token first
  select t.*
  into v_token
  from action_plan_install_tokens t
  where t.token = p_token
    and t.revoked_at is null
    and t.expires_at > now();

  if not found then
    raise exception 'Invalid or expired token';
  end if;

  -- Create the install record
  insert into action_plan_installs (
    action_plan_id,
    revision_id,
    install_token_id,
    device_install_id,
    user_agent
  ) values (
    v_token.action_plan_id,
    v_token.revision_id,
    v_token.id,
    p_device_install_id,
    p_user_agent
  )
  returning id into v_install_id;

  -- Mark the token as used (for install tokens)
  if v_token.purpose = 'install' then
    update action_plan_install_tokens
    set used_at = now()
    where id = v_token.id
      and used_at is null;
  end if;

  return v_install_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to anonymous users
grant execute on function create_install_record(text, text, text) to anon;
grant execute on function create_install_record(text, text, text) to authenticated;

comment on function create_install_record(text, text, text) is 'Creates an install record and marks the token as used (atomic operation)';
