create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================
-- groups
-- =====================
create table if not exists public.groups (
  id bigserial primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- =====================
-- group_users
-- =====================
create table if not exists public.group_users (
  user_id bigint not null,
  group_id bigint not null,
  joined_at timestamptz not null default now(),
  primary key (user_id, group_id),
  constraint fk_group_users_user foreign key (user_id) references public."Users"(id) on delete cascade,
  constraint fk_group_users_group foreign key (group_id) references public.groups(id) on delete cascade
);

create index if not exists idx_group_users_group on public.group_users (group_id, user_id);
create index if not exists idx_group_users_user on public.group_users (user_id);

-- =====================
-- user_xp 
-- =====================
create table if not exists public.user_xp (
  user_id bigint primary key,
  xp_total integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_user_xp_user foreign key (user_id) references public."Users"(id) on delete cascade
);

drop trigger if exists trg_user_xp_updated_at on public.user_xp;
create trigger trg_user_xp_updated_at
before update on public.user_xp
for each row execute procedure public.set_updated_at();

-- =====================
-- learning_history
-- =====================
create table if not exists public.learning_history (
  id bigserial primary key,
  user_id bigint not null,
  sign_id integer not null,
  completed_at timestamptz not null default now(),
  constraint fk_lh_user foreign key (user_id) references public."Users"(id) on delete cascade
);

create index if not exists idx_lh_user_time on public.learning_history (user_id, completed_at);
create index if not exists idx_lh_sign on public.learning_history (sign_id);


-- =====================
-- modules_completed (per user)
-- =====================
create table if not exists public.modules_completed (
  id bigserial primary key,
  user_id bigint not null,
  module_id integer not null,
  completed_at timestamptz not null default now(),
  constraint fk_mc_user foreign key (user_id) references public."Users"(id) on delete cascade
);

create index if not exists idx_mc_user_time on public.modules_completed (user_id, completed_at);
create index if not exists idx_mc_module on public.modules_completed (module_id);

-- =============================================
-- Function: compute_group_leaderboard
-- Calculates leaderboard for a group and period
-- period: 'week' | 'month' | 'all'
-- =============================================
create or replace function public.compute_group_leaderboard(
  p_group_id bigint,
  p_period text
)
returns table (
  user_id bigint,
  xp integer,
  signs_learned integer,
  modules_completed integer,
  rank_pos integer
)
language sql
as $$
with members as (
  select gu.user_id
  from public.group_users gu
  where gu.group_id = p_group_id
),
win as (
  select case
    when lower(coalesce(p_period,'all')) = 'week' then now() - interval '7 days'
    when lower(coalesce(p_period,'month')) = 'month' then now() - interval '30 days'
    else null
  end as from_ts
),
signs as (
  select m.user_id, count(*)::int as cnt
  from members m
  join public."Alumno_Senia" s
    on s.user_id = m.user_id
   and coalesce(s.aprendida, false) = true
  left join win w on true
  where w.from_ts is null or s.created_at >= w.from_ts
  group by m.user_id
),
mods as (
  select m.user_id, count(*)::int as cnt
  from members m
  join public.modules_completed mc
    on mc.user_id = m.user_id
  left join win w on true
  where w.from_ts is null or mc.completed_at >= w.from_ts
  group by m.user_id
),
xp_all as (
  select u.user_id, coalesce(u.xp_total, 0)::int as xp_total
  from public.user_xp u
  join members m on m.user_id = u.user_id
),
joined as (
  select m.user_id,
         coalesce(s.cnt, 0) as signs_learned,
         coalesce(md.cnt, 0) as modules_completed,
         case when lower(coalesce(p_period,'all')) = 'all'
              then coalesce(x.xp_total, 0)
              else coalesce(s.cnt,0) * 10 + coalesce(md.cnt,0) * 30
         end as xp
  from members m
  left join signs s  on s.user_id = m.user_id
  left join mods md  on md.user_id = m.user_id
  left join xp_all x on x.user_id = m.user_id
),
ranked as (
  select j.*, row_number() over (
    order by j.xp desc, j.signs_learned desc, j.modules_completed desc, j.user_id asc
  ) as rank_pos
  from joined j
)
select user_id, xp, signs_learned, modules_completed, rank_pos
from ranked
order by rank_pos;
$$;
