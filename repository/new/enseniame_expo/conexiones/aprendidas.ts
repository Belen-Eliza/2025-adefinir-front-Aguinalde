import { supabase } from '../utils/supabase'

const marcar_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
        .from('Alumno_Senia')
        .upsert(
        [{ id_alumno: id_alumno, id_senia: id_senia, aprendida: true }],
        { onConflict: 'id_alumno,id_senia' }
        )
    if (error) throw error;
}

const marcar_no_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
          .from('Alumno_Senia')
          .update({ aprendida: false })
          .eq('id_alumno', id_alumno)
          .eq('id_senia', id_senia);
    if (error) throw error;
}

const cantidad_aprendidas = async (id_alumno:number) => {
    
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*')
        .eq("id_alumno",id_alumno)
        .eq("aprendida",true)
    if (error) throw error;
    if (Alumno_Senia) return Alumno_Senia.length
    return 0
}

export {marcar_aprendida, marcar_no_aprendida, cantidad_aprendidas}