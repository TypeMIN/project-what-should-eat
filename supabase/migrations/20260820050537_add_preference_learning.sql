create table public.place_feedback (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.app_users(id) on delete cascade,
  decision_id bigint references public.meal_decisions(id) on delete cascade,
  place_id text not null,
  place_name text not null,
  category_name text not null,
  address_name text not null default '',
  road_address_name text not null default '',
  place_url text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  response text not null,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_feedback_response_value
    check (response in ('liked', 'disliked', 'not_visited')),
  constraint place_feedback_source_value
    check (source in ('decision', 'manual')),
  constraint place_feedback_source_context
    check (
      (source = 'decision' and decision_id is not null)
      or
      (source = 'manual' and decision_id is null and response <> 'not_visited')
    )
);

create unique index place_feedback_decision_user_uidx
  on public.place_feedback (decision_id, user_id)
  where decision_id is not null;

create unique index place_feedback_manual_user_place_uidx
  on public.place_feedback (user_id, place_id)
  where source = 'manual';

create index place_feedback_user_updated_idx
  on public.place_feedback (user_id, updated_at desc);

create index place_feedback_place_response_idx
  on public.place_feedback (place_id, response);

create index place_feedback_category_response_idx
  on public.place_feedback (category_name, response);

create table public.meal_comparisons (
  id bigint generated always as identity primary key,
  decision_id bigint not null references public.meal_decisions(id) on delete cascade,
  host_user_id bigint not null references public.app_users(id) on delete cascade,
  round smallint not null,
  winner_place_id text not null,
  winner_category_name text not null,
  loser_place_id text not null,
  loser_category_name text not null,
  created_at timestamptz not null default now(),
  constraint meal_comparisons_round_positive check (round > 0),
  constraint meal_comparisons_distinct_places check (winner_place_id <> loser_place_id),
  constraint meal_comparisons_decision_round_unique unique (decision_id, round)
);

create index meal_comparisons_host_created_idx
  on public.meal_comparisons (host_user_id, created_at desc);

alter table public.place_feedback enable row level security;
alter table public.meal_comparisons enable row level security;

alter table public.place_feedback force row level security;
alter table public.meal_comparisons force row level security;

revoke all on table public.place_feedback from anon, authenticated;
revoke all on table public.meal_comparisons from anon, authenticated;

grant all on table public.place_feedback to service_role;
grant all on table public.meal_comparisons to service_role;
grant usage, select on sequence public.place_feedback_id_seq to service_role;
grant usage, select on sequence public.meal_comparisons_id_seq to service_role;
