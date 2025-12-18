import { supabase } from '../utils/supabase'

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

export {marcar_aprendida, marcar_no_aprendida}