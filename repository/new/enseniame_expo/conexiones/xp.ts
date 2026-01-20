import { use } from 'react';
import { supabase } from '../utils/supabase';

/* export const fetchMyXP = async (userId: number) => {
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
}; */

const fetchMyXP = async (user_id:number)=>{
  const {data,error}= await supabase.from("Alumnos").select("xp").eq("id",user_id).single();
  if (error) throw error
  return data
}
const awardXPClient = async (userId: number, amount: number, reason?: string) => {
  //traer xp actual
  const {xp} = await fetchMyXP(userId);
  console.log(xp)
  const {error} = await supabase.from("Alumnos").update({xp:Number(xp)+amount}).eq("id",userId);
  if (error) throw error
}

const miNivel = async (id_alumno:number) => {
  
  let { data: nivel, error } = await supabase
    .from('Alumnos')
    .select('nivel')
    .eq("id",id_alumno)
    .single();
  if (error) throw error
  return nivel
}

export {fetchMyXP,awardXPClient,miNivel}