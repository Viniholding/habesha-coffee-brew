-- Add scheduled_deletion_at column to track when account should be deleted
ALTER TABLE public.account_deletion_requests 
ADD COLUMN scheduled_deletion_at timestamp with time zone;

-- Update the confirm_account_deletion function to schedule deletion instead of immediate deletion
CREATE OR REPLACE FUNCTION public.confirm_account_deletion(_token uuid, _confirmation_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Schedule deletion for 30 days from now instead of immediate deletion
  update public.account_deletion_requests
     set status = 'scheduled',
         scheduled_deletion_at = now() + interval '30 days',
         completed_at = now()
   where id = req.id;
end;
$function$;

-- Create function to cancel scheduled account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Cancel any scheduled deletion requests
  update public.account_deletion_requests
     set status = 'cancelled'
   where user_id = uid
     and status = 'scheduled';
     
  if not found then
    raise exception 'No scheduled deletion found';
  end if;
end;
$function$;

-- Create function to get scheduled deletion info
CREATE OR REPLACE FUNCTION public.get_scheduled_deletion()
RETURNS table(scheduled_at timestamp with time zone, days_remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select 
    scheduled_deletion_at,
    extract(day from (scheduled_deletion_at - now()))::numeric
  from public.account_deletion_requests
  where user_id = uid
    and status = 'scheduled'
  order by scheduled_deletion_at desc
  limit 1;
end;
$function$;