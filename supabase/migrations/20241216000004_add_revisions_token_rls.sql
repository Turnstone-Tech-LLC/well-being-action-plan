-- Migration: Add RLS policy for anonymous revision access via tokens
-- Description: This policy must run after action_plan_install_tokens table is created

-- RLS Policy: Allow anonymous SELECT via valid token (for patient access)
-- This policy allows unauthenticated users to read revision data
-- only when accessed through a valid install token
create policy "Public can view revisions via valid token"
  on action_plan_revisions
  for select
  to anon
  using (
    exists (
      select 1 from action_plan_install_tokens t
      where t.revision_id = action_plan_revisions.id
      and t.revoked_at is null
      and t.expires_at > now()
      -- Note: We don't check used_at here because patients need to re-download
      -- even after initial install (e.g., on a new device)
    )
  );
