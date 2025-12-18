-- XP / Level / Streak bonus system
-- Safe idempotent creation

create table if not exists public.user_xp (
  user_id bigint primary key references public."Users"(id) on delete cascade,
  xp_total int not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.streak_bonus_log (
  user_id bigint not null references public."Users"(id) on delete cascade,
  streak_value int not null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, streak_value)
);

-- Optional objetivos_personales table (if not exists) simplified for XP trigger
create table if not exists public.objetivos_personales (
  id bigserial primary key,
  user_id bigint not null references public."Users"(id) on delete cascade,
  descripcion text,
  completado boolean default false,
  mes int,
  anio int,
  created_at timestamptz default now()
);

-- Helper: compute level from xp
create or replace function public.compute_level(p_xp int) returns int language sql immutable as $$
  select case
    when p_xp < 500 then 1
    when p_xp < 1200 then 2
    when p_xp < 2500 then 3
    when p_xp < 4000 then 4
    when p_xp < 6000 then 5
    else 5 + ((p_xp - 6000) / 2000)
  end;
$$;

-- Award XP (atomic upsert)
create or replace function public.award_xp(p_user_id bigint, p_amount int, p_reason text default null) returns void as $$
begin
  if p_amount <= 0 then return; end if;
  insert into public.user_xp(user_id, xp_total, level)
    values (p_user_id, p_amount, compute_level(p_amount))
  on conflict (user_id) do update
    set xp_total = public.user_xp.xp_total + excluded.xp_total,
        level = compute_level(public.user_xp.xp_total + excluded.xp_total),
        updated_at = now();
end;$$ language plpgsql;

-- Recalc level on manual xp_total changes (if any direct updates occur)
create or replace function public.trg_recalc_level() returns trigger as $$
begin
  new.level = compute_level(new.xp_total);
  new.updated_at = now();
  return new;
end;$$ language plpgsql;

create trigger trg_user_xp_recalc
before update on public.user_xp
for each row execute procedure public.trg_recalc_level();

-- Streak bonus
create or replace function public.try_streak_bonus(p_user_id bigint, p_streak int) returns void as $$
declare
  bonus int;
begin
  if p_streak in (7,14,30) then
    -- Avoid double award
    if exists(select 1 from public.streak_bonus_log where user_id=p_user_id and streak_value=p_streak) then
      return; end if;
    bonus := case p_streak when 7 then 70 when 14 then 150 when 30 then 400 end;
    perform award_xp(p_user_id, bonus, 'streak_'||p_streak);
    insert into public.streak_bonus_log(user_id, streak_value) values (p_user_id, p_streak);
  end if;
end;$$ language plpgsql;

-- Trigger on Alumno_Racha table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Alumno_Racha' AND table_schema='public') THEN
    EXECUTE 'create or replace function public.trg_streak_award() returns trigger as $$
    begin
      perform public.try_streak_bonus(new.id_alumno, new.racha);
      return new;
    end;$$ language plpgsql;';
    -- Drop & recreate trigger
    EXECUTE 'drop trigger if exists trg_streak_bonus on public.Alumno_Racha';
    EXECUTE 'create trigger trg_streak_bonus after update on public.Alumno_Racha for each row execute procedure public.trg_streak_award();';
  END IF;
END$$;

-- Trigger award XP on learning a sign (Alumno_Senia)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Alumno_Senia' AND table_schema='public') THEN
    EXECUTE 'create or replace function public.trg_xp_senia() returns trigger as $$
    begin
      if (tg_op = ''INSERT'' and new.aprendida = true) then
        perform award_xp(new.user_id, 10, ''senia'');
      end if;
      return new;
    end;$$ language plpgsql;';
    EXECUTE 'drop trigger if exists trg_xp_senia on public.Alumno_Senia';
    EXECUTE 'create trigger trg_xp_senia after insert on public.Alumno_Senia for each row execute procedure public.trg_xp_senia();';
  END IF;
END$$;

-- Modules completed table (if you don't already have one)
create table if not exists public.modules_completed (
  id bigserial primary key,
  user_id bigint not null references public."Users"(id) on delete cascade,
  modulo_id bigint not null,
  completed_at timestamptz default now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='modules_completed' AND table_schema='public') THEN
    EXECUTE 'create or replace function public.trg_xp_module() returns trigger as $$
    begin
      perform award_xp(new.user_id, 100, ''modulo'');
      return new;
    end;$$ language plpgsql;';
    EXECUTE 'drop trigger if exists trg_xp_module on public.modules_completed';
    EXECUTE 'create trigger trg_xp_module after insert on public.modules_completed for each row execute procedure public.trg_xp_module();';
  END IF;
END$$;

-- Objetivos personales completion XP
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='objetivos_personales' AND table_schema='public') THEN
    EXECUTE 'create or replace function public.trg_xp_objetivo() returns trigger as $$
    begin
      if tg_op = ''UPDATE'' and coalesce(old.completado,false)=false and new.completado=true then
        perform award_xp(new.user_id, 50, ''objetivo'');
      end if;
      return new;
    end;$$ language plpgsql;';
    EXECUTE 'drop trigger if exists trg_xp_objetivo on public.objetivos_personales';
    EXECUTE 'create trigger trg_xp_objetivo after update on public.objetivos_personales for each row execute procedure public.trg_xp_objetivo();';
  END IF;
END$$;
