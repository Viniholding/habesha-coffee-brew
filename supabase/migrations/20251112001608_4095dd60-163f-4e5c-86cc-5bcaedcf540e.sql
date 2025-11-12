-- Update confirm_account_deletion to require typed confirmation text
create or replace function public.confirm_account_deletion(_token uuid, _confirmation_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  req record;
  last_login timestamptz;
  require_recent_login interval := interval '10 minutes';
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify confirmation text is exactly "DELETE"
  if _confirmation_text is distinct from 'DELETE' then
    raise exception 'Confirmation text must be exactly "DELETE"';
  end if;

  select * into req
    from public.account_deletion_requests
   where token = _token
     and user_id = uid
   limit 1;

  if req is null then
    raise exception 'Invalid or unauthorized deletion token';
  end if;

  if req.status <> 'pending' then
    raise exception 'Deletion request is not pending';
  end if;

  if now() > req.expires_at then
    update public.account_deletion_requests set status = 'expired' where id = req.id;
    raise exception 'Deletion token has expired';
  end if;

  -- Check for recent password confirmation
  select u.last_sign_in_at into last_login from auth.users u where u.id = uid;
  if last_login is null or now() - last_login > require_recent_login then
    raise exception 'Recent password confirmation required. Please sign in again and retry.';
  end if;

  -- Perform the actual deletion
  perform public.delete_user();

  -- Mark request as completed
  update public.account_deletion_requests
     set status = 'completed', completed_at = now()
   where id = req.id;
end;
$$;