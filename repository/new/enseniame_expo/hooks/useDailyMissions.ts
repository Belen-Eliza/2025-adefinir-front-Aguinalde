import { useEffect, useState, useCallback } from 'react';
import { ensureDailyMissions, fetchDailyMissions, incrementMissionProgress, subscribeDailyMissions, Mission, fetchFullCompletionStreak } from '../conexiones/misiones';
import { supabase } from '../lib/supabase';

export function useDailyMissions(userId?: number) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakFull, setStreakFull] = useState(0);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const list = await ensureDailyMissions(userId);
    setMissions(list);
    const s = await fetchFullCompletionStreak(userId);
    setStreakFull(s);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeDailyMissions(userId, () => {
      fetchDailyMissions(userId).then(setMissions);
      fetchFullCompletionStreak(userId).then(setStreakFull);
    });
    return unsub;
  }, [userId]);

  const progressRatio = missions.length ? missions.reduce((acc,m)=> acc + Math.min(1, m.current_value / m.target_value),0) / missions.length : 0;
  const allCompleted = missions.length > 0 && missions.every(m => m.status === 'completed');

  const increment = (missionType: string, value: number = 1) => {
    if (!userId) return;
    incrementMissionProgress(userId, missionType, value);
  };

  return { missions, loading, increment, progressRatio, allCompleted, streakFull };
}
