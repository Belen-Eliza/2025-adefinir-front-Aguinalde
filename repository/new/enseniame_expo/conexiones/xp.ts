import { supabase } from '../lib/supabase';

export const fetchMyXP = async (userId: number) => {
  const { data, error } = await supabase
    .from('user_xp')
    .select('xp_total, level')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { xp_total: 0, level: 1 };
  if (!data) return { xp_total: 0, level: 1 };
  return { xp_total: data.xp_total ?? 0, level: data.level ?? 1 };
};

export const awardXPClient = async (userId: number, amount: number, reason?: string) => {
  const { error } = await supabase.rpc('award_xp', { p_user_id: userId, p_amount: amount, p_reason: reason ?? null });
  if (error) console.warn('[awardXPClient] error:', error.message);
};
