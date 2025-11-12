-- backing table for account deletion requests
create table if not exists public.account_deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  token        uuid not null unique,
  status       text not null default 'pending' check (status in ('pending','completed','expired','cancelled')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  completed_at timestamptz
);

alter table public.account_deletion_requests enable row level security;

create policy "owner_can_view" on public.account_deletion_requests
  for select using (auth.uid() = user_id);

create index if not exists idx_delreq_user_status
  on public.account_deletion_requests(user_id, status);

-- step 1: request token when initiating deletion
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

  -- expire any pending requests
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

-- step 2: confirm deletion with token (requires recent password re-auth)
create or replace function public.confirm_account_deletion(_token uuid)
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

  -- check for recent password confirmation
  select u.last_sign_in_at into last_login from auth.users u where u.id = uid;
  if last_login is null or now() - last_login > require_recent_login then
    raise exception 'Recent password confirmation required. Please sign in again and retry.';
  end if;

  -- perform the actual deletion
  perform public.delete_user();

  -- mark request as completed
  update public.account_deletion_requests
     set status = 'completed', completed_at = now()
   where id = req.id;
end;
$$;