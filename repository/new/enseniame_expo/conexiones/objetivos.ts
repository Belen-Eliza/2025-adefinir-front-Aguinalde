import { supabase } from '../lib/supabase'

const mis_objetivos_completados = async (id_alumno:number) => {
    
    let { data: objetivos, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq("user_id",id_alumno)
        .eq("completado",true);
    if (error) throw error
    return objetivos 
}

export {mis_objetivos_completados}