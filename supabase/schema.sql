-- FERADIOZ member approval schema
-- Run this file once in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Members can read approved profiles and own profile" on public.profiles;
create policy "Members can read approved profiles and own profile"
on public.profiles for select to authenticated
using (id = auth.uid() or status = 'approved');

drop policy if exists "Users can update their own pending profile" on public.profiles;
create policy "Users can update their own pending profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and status = 'pending');

create or replace function public.create_feradioz_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_username text;
  chosen_name text;
begin
  chosen_username := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  chosen_name := coalesce(new.raw_user_meta_data ->> 'display_name', chosen_username);
  insert into public.profiles (id, username, display_name, status)
  values (new.id, chosen_username, chosen_name, 'pending');
  return new;
end;
$$;

drop trigger if exists on_feradioz_auth_user_created on auth.users;
create trigger on_feradioz_auth_user_created
after insert on auth.users
for each row execute procedure public.create_feradioz_profile();

-- Owner approval: after a friend requests access, run:
-- update public.profiles set status = 'approved' where username = 'friend_username';
-- Reject a request with:
-- update public.profiles set status = 'rejected' where username = 'friend_username';
