import { supabase } from '../lib/supabase'

const marcar_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
        .from('Alumno_Senia')
        .upsert(
        [{ user_id: id_alumno, senia_id: id_senia, aprendida: true }],
        { onConflict: 'user_id,senia_id' }
        )
    if (error) throw error;
}

const marcar_no_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
          .from('Alumno_Senia')
          .update({ aprendida: false })
          .eq('user_id', id_alumno)
          .eq('senia_id', id_senia);
    if (error) throw error;
}

const cantidad_aprendidas = async (id_alumno:number) => {
    
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*')
        .eq("user_id",id_alumno)
        .eq("aprendida",true)
    if (error) throw error;
    if (Alumno_Senia) return Alumno_Senia.length
    return 0
}

export {marcar_aprendida, marcar_no_aprendida, cantidad_aprendidas}