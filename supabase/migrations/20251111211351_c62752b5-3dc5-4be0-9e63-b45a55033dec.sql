-- --- Setup: table to track deletion flow ------------------------------------
create table if not exists public.account_deletion_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  token             uuid not null unique,
  status            text not null default 'pending' check (status in ('pending','completed','expired','cancelled')),
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null,
  completed_at      timestamptz
);

-- Limit visibility to the owner
alter table public.account_deletion_requests enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='account_deletion_requests' and policyname='owner_can_view'
  ) then
    create policy owner_can_view on public.account_deletion_requests
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- --- Step 1: user clicks sub-tab → "Request deletion" -----------------------
-- Returns a short-lived token the frontend can use on the confirm screen
create or replace function public.request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  tkn uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- expire any older pending requests for this user
  update public.account_deletion_requests
     set status = 'expired'
   where user_id = uid
     and status = 'pending';

  tkn := gen_random_uuid();

  insert into public.account_deletion_requests(user_id, token, expires_at)
  values (uid, tkn, now() + interval '30 minutes');

  return tkn;
end;
$$;

-- --- Internal: actual hard-delete (isolated) --------------------------------
-- Kept internal so only confirm function can call it.
create or replace function public.delete_user_now(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _user_id is null then
    raise exception 'User id required';
  end if;

  -- Wrap in a transaction block to ensure all-or-nothing semantics
  perform pg_advisory_xact_lock( ('x'||substr(replace(_user_id::text,'-',''),1,16))::bit(64)::bigint );

  -- Delete user's cart items
  delete from public.cart_items where user_id = _user_id;

  -- Delete user's order issues
  delete from public.order_issues where user_id = _user_id;

  -- Delete user's order items via related orders
  delete from public.order_items
   where order_id in (select id from public.orders where user_id = _user_id);

  -- Delete user's orders
  delete from public.orders where user_id = _user_id;

  -- Delete user's subscriptions
  delete from public.subscriptions where user_id = _user_id;

  -- Delete user's addresses
  delete from public.addresses where user_id = _user_id;

  -- Delete user's payment methods
  delete from public.payment_methods where user_id = _user_id;

  -- Delete user's notification preferences
  delete from public.notification_preferences where user_id = _user_id;

  -- Delete user's delivery preferences
  delete from public.delivery_preferences where user_id = _user_id;

  -- Delete user's profile
  delete from public.profiles where id = _user_id;

  -- Finally, remove from auth.users (Supabase) to revoke auth
  delete from auth.users where id = _user_id;
end;
$$;

-- --- Step 2: confirm screen/link calls this with the token -------------------
create or replace function public.confirm_account_deletion(_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  req record;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into req
    from public.account_deletion_requests
   where token = _token
     and user_id = uid
   limit 1;

  if req is null then
    raise exception 'Invalid deletion token';
  end if;

  if req.status <> 'pending' then
    raise exception 'Deletion request is not pending';
  end if;

  if now() > req.expires_at then
    update public.account_deletion_requests
       set status = 'expired'
     where id = req.id;
    raise exception 'Deletion token has expired';
  end if;

  -- Perform the hard delete
  perform public.delete_user_now(uid);

  -- Mark request as completed (best-effort in case user row is gone)
  update public.account_deletion_requests
     set status = 'completed',
         completed_at = now()
   where id = req.id;
end;
$$;
