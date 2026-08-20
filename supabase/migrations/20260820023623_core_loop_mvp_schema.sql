create table public.app_users (
  id bigint generated always as identity primary key,
  login_id text not null unique,
  pin_hash text not null,
  display_name text not null,
  birth_year smallint not null,
  gender text not null,
  created_at timestamptz not null default now(),
  constraint app_users_login_id_format check (login_id ~ '^[a-z0-9_]{3,20}$'),
  constraint app_users_display_name_length check (char_length(display_name) between 1 and 30),
  constraint app_users_birth_year_range check (birth_year between 1900 and 2100),
  constraint app_users_gender_value check (gender in ('male', 'female', 'other', 'prefer_not_to_say'))
);

create table public.app_sessions (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index app_sessions_user_id_idx on public.app_sessions (user_id);
create index app_sessions_expires_at_idx on public.app_sessions (expires_at);

create table public.meal_decisions (
  id bigint generated always as identity primary key,
  host_user_id bigint not null references public.app_users(id) on delete restrict,
  place_id text not null,
  place_name text not null,
  category_name text not null,
  distance_meters integer not null,
  address_name text not null default '',
  road_address_name text not null default '',
  place_url text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  decided_at timestamptz not null default now(),
  constraint meal_decisions_distance_nonnegative check (distance_meters >= 0)
);

create index meal_decisions_host_user_id_idx on public.meal_decisions (host_user_id);
create index meal_decisions_decided_at_idx on public.meal_decisions (decided_at desc);
create index meal_decisions_place_recent_idx on public.meal_decisions (place_id, decided_at desc);

create table public.meal_decision_participants (
  decision_id bigint not null references public.meal_decisions(id) on delete cascade,
  user_id bigint not null references public.app_users(id) on delete restrict,
  primary key (decision_id, user_id)
);

create index meal_decision_participants_user_decision_idx
  on public.meal_decision_participants (user_id, decision_id);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.meal_decisions enable row level security;
alter table public.meal_decision_participants enable row level security;

alter table public.app_users force row level security;
alter table public.app_sessions force row level security;
alter table public.meal_decisions force row level security;
alter table public.meal_decision_participants force row level security;

revoke all on table public.app_users from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;
revoke all on table public.meal_decisions from anon, authenticated;
revoke all on table public.meal_decision_participants from anon, authenticated;

grant all on table public.app_users to service_role;
grant all on table public.app_sessions to service_role;
grant all on table public.meal_decisions to service_role;
grant all on table public.meal_decision_participants to service_role;
grant usage, select on all sequences in schema public to service_role;
