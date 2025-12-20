-- Migration: Add provider exists check function
-- Description: Secure function to check if a provider profile exists for an email
-- Used during auth to prevent sending magic links to non-provider emails

create or replace function public.provider_exists_for_email(check_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from provider_profiles
    where lower(email) = lower(check_email)
  );
end;
$$;

-- Grant execute to anonymous users (needed for pre-auth check)
grant execute on function public.provider_exists_for_email(text) to anon;
grant execute on function public.provider_exists_for_email(text) to authenticated;

comment on function public.provider_exists_for_email(text) is 'Check if a provider profile exists for the given email. Used during auth flow.';
