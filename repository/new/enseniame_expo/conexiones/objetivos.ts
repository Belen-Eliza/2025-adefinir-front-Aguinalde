import { supabase } from '../utils/supabase'

const mis_objetivos_completados = async (id_alumno:number) => {
    
    let { data: objetivos, error } = await supabase
        .from('Objetivos')
        .select('*')
        .eq("id_alumno",id_alumno)
        .eq("completado",true);
    if (error) throw error
    return objetivos 
}
const mis_objetivos = async (id_alumno:number) => {
    
    let { data: objetivos, error } = await supabase
        .from('Objetivos')
        .select('*')
        .eq("id_alumno",id_alumno);        
    if (error) throw error
    return objetivos 
}


export {mis_objetivos_completados,mis_objetivos}