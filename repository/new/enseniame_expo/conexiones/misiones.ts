import { supabase } from '../lib/supabase';

export type Mission = {
  id: number;
  mission_type: string;
  mission_date: string;
  target_value: number;
  current_value: number;
  status: 'active' | 'completed' | 'expired';
  xp_reward: number;
  coin_reward: number;
  completed_at?: string | null;
};

// Ensure today's missions exist; if not, generate.
export async function ensureDailyMissions(userId: number): Promise<Mission[]> {
  const gen = await supabase.rpc('generate_daily_missions', { p_user: userId });
  if (gen.error) {
    console.warn('[missions] generate_daily_missions error:', gen.error.message);
    // Si la función no existe (migración no aplicada) devolver [] para que la UI muestre advertencia
    if (gen.error.message.includes('Could not find the function')) {
      return [];
    }
  }
  return fetchDailyMissions(userId);
}

export async function fetchDailyMissions(userId: number): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('vw_today_missions')
    .select('*')
    .eq('user_id', userId)
    .order('mission_type');
  if (error) {
    console.error('[missions] fetch error', error.message);
    // Si la vista no existe, devolver [] y permitir que la UI avise aplicar migración
    if (error.message.includes('Could not find the table')) {
      return [];
    }
    return [];
  }
  return (data || []) as Mission[];
}

export async function incrementMissionProgress(userId: number, missionType: string, value: number = 1) {
  const { error } = await supabase.rpc('increment_mission_progress', { p_user: userId, p_mission_type: missionType, p_value: value });
  if (error) console.error('[missions] increment error', error.message);
}

export function subscribeDailyMissions(userId: number, onChange: () => void) {
  const channel = supabase.channel(`rt-daily-missions-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_missions', filter: `user_id=eq.${userId}` }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_progress' }, () => onChange())
    .subscribe();
  return () => { try { supabase.removeChannel(channel); } catch {} };
}

export async function fetchMissionBadges(userId: number) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_code, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) { console.error('[missions] badges error', error.message); return []; }
  return data || [];
}

export async function fetchFullCompletionStreak(userId: number): Promise<number> {
  const { data, error } = await supabase
    .from('daily_full_completion')
    .select('completion_date')
    .eq('user_id', userId)
    .order('completion_date', { ascending: false });
  if (error || !data) return 0;
  let streak = 0;
  const today = new Date();
  const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  for (const row of data) {
    const d = new Date(row.completion_date);
    const diff = (normalize(today).getTime() - normalize(d).getTime()) / 86400000;
    if (diff === streak) streak++; else break;
  }
  return streak;
}
