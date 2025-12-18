import { supabase } from '@/lib/supabase';
import type { PeriodType, LeaderboardResponse, LeaderboardEntry } from '@/components/leaderboard/types';


const mockGenerate = (period: PeriodType, groupId: number, selfUserId: number): LeaderboardResponse => {
  const base: LeaderboardEntry[] = Array.from({ length: 10 }).map((_, i) => ({
    position: i + 1,
    userId: 1000 + i,
    name: `Alumno ${i + 1}`,
    avatar: null,
    level: 1 + Math.floor(Math.random() * 5),
    xp: 200 - i * 10,
    signsLearned: 40 - i * 3,
    modulesCompleted: 5 - Math.floor(i / 2),
  }));
  const selfIndex = base.findIndex(e => e.userId === selfUserId);
  let selfEntry: LeaderboardEntry | undefined = undefined;
  if (selfIndex === -1) {
    selfEntry = {
      position: 17,
      userId: selfUserId,
      name: 'Yo',
      avatar: null,
      level: 3,
      xp: 95,
      signsLearned: 12,
      modulesCompleted: 1,
      isSelf: true,
    };
  } else {
    base[selfIndex].isSelf = true;
    selfEntry = base[selfIndex];
  }
  return {
    groupId,
    groupName: 'Grupo Lectura (Mock)',
    period,
    myPosition: selfEntry?.position ?? null,
    entries: base,
    selfEntry,
  };
};

function periodWindow(period: PeriodType): { from?: string } {
  const now = new Date();
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from: from.toISOString() };
  }
  if (period === 'month') {
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    return { from: from.toISOString() };
  }
  return {}; 
}

export async function fetchGroupLeaderboard(period: PeriodType, groupId: number, selfUserId: number): Promise<LeaderboardResponse> {
  
  try {
    // Fetch group name
    const { data: groupRow } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .maybeSingle();
    const groupName = groupRow?.name ?? `Grupo ${groupId}`;

    const { data: rows, error: rpcErr } = await supabase
      .rpc('compute_group_leaderboard', { p_group_id: groupId, p_period: period });
    if (rpcErr) throw rpcErr;

    // Get user display info for involved users
    const userIds = (rows || []).map((r: any) => Number(r.user_id));
    const { data: users, error: uErr } = await supabase
      .from('Users')
      .select('id, username, avatar')
      .in('id', userIds);
    if (uErr) throw uErr;
    const userMap = new Map<number, { name: string; avatar: string | null }>();
    (users || []).forEach((u: any) => {
      const name = String((u?.username ?? '').trim() || 'Alumno');
      
      const avatar = u?.avatar != null ? String(u.avatar) : null;
      userMap.set(Number(u.id), { name, avatar });
    });

    const entries: LeaderboardEntry[] = (rows || []).map((r: any) => ({
      position: Number(r.rank_pos ?? r.position ?? 0),
      userId: Number(r.user_id),
  name: userMap.get(Number(r.user_id))?.name || `Alumno ${r.user_id}`,
  avatar: userMap.get(Number(r.user_id))?.avatar ?? null,
      level: undefined,
      xp: Number(r.xp ?? 0),
      signsLearned: Number(r.signs_learned ?? 0),
      modulesCompleted: Number(r.modules_completed ?? 0),
      isSelf: Number(r.user_id) === selfUserId,
    }));

    const top = entries.slice(0, 10);
    const selfEntry = entries.find((e) => e.userId === selfUserId);
    return {
      groupId,
      groupName,
      period,
      myPosition: selfEntry?.position ?? null,
      entries: top,
      selfEntry,
    };
  } catch (e) {
    const { from } = periodWindow(period);
    const { data: membership, error: memErr } = await supabase
      .from('group_users')
      .select('user_id')
      .eq('group_id', groupId);
    if (memErr) throw memErr;
    const userIds: number[] = (membership || []).map((m: any) => Number(m.user_id));

    const { data: users } = await supabase
      .from('Users')
      .select('id, username, avatar')
      .in('id', userIds);
    const userMap = new Map<number, { name: string; avatar: string | null }>();
    (users || []).forEach((u: any) => {
      const name = String((u?.username ?? '').trim() || 'Alumno');
      const avatar = u?.avatar != null ? String(u.avatar) : null;
      userMap.set(Number(u.id), { name, avatar });
    });

    const { data: xpRows } = await supabase
      .from('user_xp')
      .select('user_id, xp_total, level')
      .in('user_id', userIds);
    const xpMap = new Map<number, { xp_total: number; level: number }>();
    (xpRows || []).forEach((x: any) => xpMap.set(Number(x.user_id), { xp_total: Number(x.xp_total ?? 0), level: Number(x.level ?? 1) }));

    let aprendidasQuery = supabase
      .from('Alumno_Senia')
      .select('user_id, created_at')
      .eq('aprendida', true)
      .in('user_id', userIds);
    if (from) aprendidasQuery = aprendidasQuery.gte('created_at', from);
    const { data: aprendidas } = await aprendidasQuery;
    const signsCount = new Map<number, number>();
    (aprendidas || []).forEach((r: any) => {
      const uid = Number(r.user_id);
      signsCount.set(uid, (signsCount.get(uid) || 0) + 1);
    });

    let modsQuery = supabase
      .from('modules_completed')
      .select('user_id, completed_at')
      .in('user_id', userIds);
    if (from) modsQuery = modsQuery.gte('completed_at', from);
    const { data: mods } = await modsQuery;
    const modulesCount = new Map<number, number>();
    (mods || []).forEach((r: any) => {
      const uid = Number(r.user_id);
      modulesCount.set(uid, (modulesCount.get(uid) || 0) + 1);
    });

    const WINDOW_XP_SIGN = 10;
    const WINDOW_XP_MODULE = 30;

    const entries: LeaderboardEntry[] = userIds.map((uid) => {
      const info = userMap.get(uid);
      const xpInfo = xpMap.get(uid);
      const s = signsCount.get(uid) || 0;
      const m = modulesCount.get(uid) || 0;
      const xpWindow = s * WINDOW_XP_SIGN + m * WINDOW_XP_MODULE;
      return {
        position: 0,
        userId: uid,
        name: info?.name || `Alumno ${uid}`,
  avatar: userMap.get(uid)?.avatar ?? null,
        level: xpInfo?.level ?? 1,
        xp: period === 'all' ? xpInfo?.xp_total ?? xpWindow : xpWindow,
        signsLearned: s,
        modulesCompleted: m,
        isSelf: uid === selfUserId,
      };
    });

    entries.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0) || (b.signsLearned ?? 0) - (a.signsLearned ?? 0) || (b.modulesCompleted ?? 0) - (a.modulesCompleted ?? 0));
    entries.forEach((e, i) => (e.position = i + 1));

    const top = entries.slice(0, 10);
    const selfEntry = entries.find((e) => e.userId === selfUserId);

    return {
      groupId,
      groupName: `Grupo ${groupId}`,
      period,
      myPosition: selfEntry?.position ?? null,
      entries: top,
      selfEntry,
    };
  }
}