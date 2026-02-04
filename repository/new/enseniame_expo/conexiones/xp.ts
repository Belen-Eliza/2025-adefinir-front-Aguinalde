import { supabase } from '../utils/supabase';

const fetchMyXP = async (user_id:number)=>{
  const {data,error}= await supabase.from("Alumnos").select("xp").eq("id",user_id).single();
  if (error) throw error
  return data
}
const awardXPClient = async (userId: number, amount: number, reason?: string) => {
  //traer xp actual  
  const {xp} = await fetchMyXP(userId);  
  let nuevo_xp = Number(xp)+amount;
  
  const {error} = await supabase.from("Alumnos").update({xp:nuevo_xp}).eq("id",userId);
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