-- FERADIOZ member approval + private Join PIN
-- Run in Supabase Dashboard > SQL Editor. Safe to run again.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
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
  values (new.id, chosen_username, chosen_name, 'approved');
  return new;
end;
$$;

drop trigger if exists on_feradioz_auth_user_created on auth.users;
create trigger on_feradioz_auth_user_created
after insert on auth.users
for each row execute procedure public.create_feradioz_profile();

-- The PIN table is not readable by normal users.
create table if not exists public.feradioz_settings (
  setting_key text primary key,
  setting_value text not null
);
alter table public.feradioz_settings enable row level security;
revoke all on public.feradioz_settings from anon, authenticated;

-- Set your own private Join PIN here before sharing it with friends.
insert into public.feradioz_settings (setting_key, setting_value)
values ('join_pin', 'CHANGE-THIS-PIN')
on conflict (setting_key) do nothing;

create or replace function public.verify_feradioz_join_pin(input_pin text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (select setting_value = input_pin
     from public.feradioz_settings
     where setting_key = 'join_pin'),
    false
  );
$$;

revoke all on function public.verify_feradioz_join_pin(text) from public;
grant execute on function public.verify_feradioz_join_pin(text) to anon, authenticated;

-- IMPORTANT: change CHANGE-THIS-PIN to your own PIN in the SQL editor:
-- update public.feradioz_settings set setting_value = 'YOUR-PRIVATE-PIN' where setting_key = 'join_pin';
--
-- Supabase Dashboard > Authentication > Sign In / Providers > Email:
-- Turn OFF "Confirm email" so users do not need an email address.
--
-- Approve a friend:
-- update public.profiles set status = 'approved' where username = 'friend_username';
-- Reject a friend:
-- update public.profiles set status = 'rejected' where username = 'friend_username';
