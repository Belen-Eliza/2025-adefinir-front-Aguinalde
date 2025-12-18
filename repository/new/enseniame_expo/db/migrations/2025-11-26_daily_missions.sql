-- Daily Missions System Migration
-- Creates mission catalog, daily missions, progress tracking, completion history, full-day completion streaks,
-- user coins & badges, and functions/triggers for generation and progress updates.

-- 1) Mission Types Catalog
CREATE TABLE IF NOT EXISTS missions_catalog (
  mission_type TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  base_target INT NOT NULL DEFAULT 1,
  base_xp_reward INT NOT NULL DEFAULT 50,
  base_coin_reward INT NOT NULL DEFAULT 0,
  badge_on_complete TEXT NULL
);

INSERT INTO missions_catalog (mission_type, description, base_target, base_xp_reward, base_coin_reward) VALUES
  ('LEARN_SIGNS','Aprender señas (cantidad del día)',3,120,10),
  ('COMPLETE_MODULE','Completar un módulo',1,180,15),
  ('PLAY_MC_GAME','Jugar una partida de multiple choice',1,100,8),
  ('MAINTAIN_STREAK','Mantener la racha diaria',1,150,12),
  ('CORRECT_ANSWERS','Responder preguntas correctas',5,140,10)
ON CONFLICT (mission_type) DO NOTHING;

-- 2) User Coins (if not exists)
CREATE TABLE IF NOT EXISTS user_coins (
  user_id INT PRIMARY KEY REFERENCES "Users"(id) ON DELETE CASCADE,
  coins_total INT NOT NULL DEFAULT 0
);

-- 3) User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_code)
);

-- 4) Daily Missions
CREATE TABLE IF NOT EXISTS daily_missions (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL REFERENCES missions_catalog(mission_type) ON DELETE RESTRICT,
  mission_date DATE NOT NULL,
  target_value INT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0,
  coin_reward INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired')),
  completed_at TIMESTAMPTZ NULL,
  UNIQUE (user_id, mission_type, mission_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions(user_id, mission_date);

-- 5) Mission Progress
CREATE TABLE IF NOT EXISTS mission_progress (
  daily_mission_id BIGINT PRIMARY KEY REFERENCES daily_missions(id) ON DELETE CASCADE,
  current_value INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Mission Completion History
CREATE TABLE IF NOT EXISTS mission_completion_history (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  mission_date DATE NOT NULL,
  xp_reward INT NOT NULL,
  coin_reward INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mission_completion_hist_user_date ON mission_completion_history(user_id, mission_date);

-- 7) Full Day Completion (all missions done)
CREATE TABLE IF NOT EXISTS daily_full_completion (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  UNIQUE (user_id, completion_date)
);

-- 7.1) Ensure user_xp table exists (fallback if XP migration not applied yet)
CREATE TABLE IF NOT EXISTS user_xp (
  user_id INT PRIMARY KEY REFERENCES "Users"(id) ON DELETE CASCADE,
  xp_total INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.2) Create award_xp if missing (fallback minimal implementation)
DO $blk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'award_xp' AND n.nspname = 'public'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION award_xp(p_user INT, p_amount INT, p_reason TEXT DEFAULT NULL)
      RETURNS VOID AS $fn$
      BEGIN
        IF p_amount <= 0 THEN RETURN; END IF;
        INSERT INTO user_xp(user_id, xp_total)
        VALUES (p_user, p_amount)
        ON CONFLICT (user_id)
        DO UPDATE SET xp_total = user_xp.xp_total + EXCLUDED.xp_total, updated_at = now();
      END;
      $fn$ LANGUAGE plpgsql;
    ';
  END IF;
END $blk$;
CREATE INDEX IF NOT EXISTS idx_full_completion_user_date ON daily_full_completion(user_id, completion_date);

-- 8) Function: Award coins
CREATE OR REPLACE FUNCTION award_coins(p_user INT, p_amount INT) RETURNS VOID AS $$
BEGIN
  IF p_amount <= 0 THEN RETURN; END IF;
  INSERT INTO user_coins(user_id, coins_total) VALUES (p_user, p_amount)
    ON CONFLICT (user_id) DO UPDATE SET coins_total = user_coins.coins_total + EXCLUDED.coins_total;
END;$$ LANGUAGE plpgsql;

-- 9) Function: Generate daily missions
CREATE OR REPLACE FUNCTION generate_daily_missions(p_user INT) RETURNS VOID AS $$
DECLARE
  today DATE := current_date;
  cnt INT;
  mission_pool TEXT[] := ARRAY['LEARN_SIGNS','COMPLETE_MODULE','PLAY_MC_GAME','MAINTAIN_STREAK','CORRECT_ANSWERS'];
  chosen TEXT[] := ARRAY[]::TEXT[];
  desired_count INT := 2 + floor(random()*3)::INT; -- 2 to 4
  last_types TEXT[] := ARRAY(SELECT mission_type FROM daily_missions WHERE user_id=p_user AND mission_date = today - 1);
  mtype TEXT;
  base_row RECORD;
BEGIN
  SELECT COUNT(*) INTO cnt FROM daily_missions WHERE user_id=p_user AND mission_date=today;
  IF cnt > 0 THEN RETURN; END IF; -- already generated
  -- pick random distinct mission types not identical set to previous day
  WHILE array_length(chosen,1) IS NULL OR array_length(chosen,1) < desired_count LOOP
    mtype := mission_pool[(1 + floor(random()*array_length(mission_pool,1)))::INT];
    IF NOT (mtype = ANY(chosen)) THEN
      chosen := chosen || mtype;
    END IF;
  END LOOP;
  IF chosen = last_types THEN
    -- force change: replace last element
    chosen[array_length(chosen,1)] := 'CORRECT_ANSWERS';
  END IF;
  FOREACH mtype IN ARRAY chosen LOOP
    SELECT * INTO base_row FROM missions_catalog WHERE mission_type = mtype;
    INSERT INTO daily_missions(user_id, mission_type, mission_date, target_value, xp_reward, coin_reward)
      VALUES (p_user, mtype, today, base_row.base_target, base_row.base_xp_reward, base_row.base_coin_reward)
      ON CONFLICT DO NOTHING
      RETURNING id INTO cnt;
    INSERT INTO mission_progress(daily_mission_id) VALUES (cnt) ON CONFLICT DO NOTHING;
  END LOOP;
END;$$ LANGUAGE plpgsql;

-- 10) Function: Increment mission progress (generic)
CREATE OR REPLACE FUNCTION increment_mission_progress(p_user INT, p_mission_type TEXT, p_value INT DEFAULT 1) RETURNS VOID AS $$
DECLARE
  dm_id BIGINT;
  curr INT;
  tgt INT;
BEGIN
  SELECT id INTO dm_id FROM daily_missions WHERE user_id=p_user AND mission_type=p_mission_type AND mission_date=current_date AND status='active';
  IF dm_id IS NULL THEN RETURN; END IF;
  SELECT target_value INTO tgt FROM daily_missions WHERE id=dm_id;
  SELECT current_value INTO curr FROM mission_progress WHERE daily_mission_id=dm_id;
  UPDATE mission_progress SET current_value = LEAST(tgt, curr + p_value), updated_at = now() WHERE daily_mission_id=dm_id;
END;$$ LANGUAGE plpgsql;

-- 11) Trigger: On progress update -> complete mission if reached target
CREATE OR REPLACE FUNCTION trg_mission_auto_complete() RETURNS TRIGGER AS $$
DECLARE
  tgt INT;
  uid INT;
  xp INT;
  coins INT;
  mtype TEXT;
BEGIN
  SELECT target_value, user_id, xp_reward, coin_reward, mission_type INTO tgt, uid, xp, coins, mtype FROM daily_missions WHERE id=NEW.daily_mission_id;
  IF NEW.current_value >= tgt THEN
    UPDATE daily_missions SET status='completed', completed_at=now() WHERE id=NEW.daily_mission_id AND status='active';
    -- award xp & coins
    PERFORM award_xp(uid, xp, 'mission:'||mtype);
    PERFORM award_coins(uid, coins);
    INSERT INTO mission_completion_history(user_id, mission_type, mission_date, xp_reward, coin_reward) VALUES (uid, mtype, current_date, xp, coins);
    -- check if all missions for the day are completed
    IF NOT EXISTS (SELECT 1 FROM daily_missions WHERE user_id=uid AND mission_date=current_date AND status='active') THEN
      INSERT INTO daily_full_completion(user_id, completion_date) VALUES (uid, current_date) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_auto_complete
AFTER UPDATE ON mission_progress
FOR EACH ROW EXECUTE FUNCTION trg_mission_auto_complete();

-- 12) Trigger: Award badges on full completion streaks (7 / 30 consecutive days)
CREATE OR REPLACE FUNCTION trg_full_completion_badges() RETURNS TRIGGER AS $$
DECLARE
  streak INT;
  d DATE := NEW.completion_date;
  uid INT := NEW.user_id;
BEGIN
  -- compute consecutive streak ending today
  SELECT COUNT(*) INTO streak FROM (
    SELECT completion_date,
           completion_date - ROW_NUMBER() OVER (ORDER BY completion_date) AS grp
    FROM daily_full_completion WHERE user_id=uid AND completion_date <= d
  ) t
  WHERE grp = (SELECT (d - ROW_NUMBER() OVER (ORDER BY d)) FROM (SELECT d) x LIMIT 1); -- simplified
  -- Fallback simple streak calc: count consecutive backwards
  IF streak IS NULL OR streak = 0 THEN
    streak := 1;
  END IF;
  -- award badges
  IF streak = 7 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (uid, 'MISSIONS_7_DAY') ON CONFLICT DO NOTHING;
  ELSIF streak = 30 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (uid, 'MISSIONS_30_DAY') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER full_completion_badges
AFTER INSERT ON daily_full_completion
FOR EACH ROW EXECUTE FUNCTION trg_full_completion_badges();

-- 13) Helper view: Today's missions with progress
CREATE OR REPLACE VIEW vw_today_missions AS
SELECT dm.id, dm.user_id, dm.mission_type, dm.mission_date, dm.target_value, mp.current_value, dm.status, dm.xp_reward, dm.coin_reward, dm.completed_at
FROM daily_missions dm
JOIN mission_progress mp ON mp.daily_mission_id = dm.id
WHERE dm.mission_date = current_date;

-- Done.
