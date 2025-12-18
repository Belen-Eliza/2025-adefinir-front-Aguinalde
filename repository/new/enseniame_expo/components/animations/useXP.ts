import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchMyXP } from '@/conexiones/xp';

export function useXP(userId: number | undefined) {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [delta, setDelta] = useState(0); // XP ganado recientemente
  const prevXpRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = async () => {
      const res = await fetchMyXP(userId);
      if (!active) return;
      setXp(res.xp_total);
      setLevel(res.level);
      prevXpRef.current = res.xp_total;
    };
    load();

    const channel = supabase.channel(`rt-user-xp-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_xp', filter: `user_id=eq.${userId}` }, (payload: any) => {
        const newXp = payload.new.xp_total ?? 0;
        const newLevel = payload.new.level ?? 1;
        const oldXp = prevXpRef.current;
        const gained = Math.max(0, newXp - oldXp);
        prevXpRef.current = newXp;
        setXp(newXp);
        setLevel(newLevel);
        setDelta(gained);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); active = false; };
  }, [userId]);

  // Consumir delta (reiniciar después de animación)
  const consumeDelta = () => setDelta(0);

  return { xp, level, delta, consumeDelta };
}
