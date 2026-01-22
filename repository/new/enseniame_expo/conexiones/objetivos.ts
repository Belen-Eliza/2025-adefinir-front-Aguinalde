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

const crear_objetivo = async (id_alumno:number,titulo:string,descripcion?:string,fecha_limite?:Date) => {
    const { error } = await supabase
        .from('Objetivos')
        .insert([{ titulo: titulo, descripcion: descripcion, fecha_limite: fecha_limite, completado: false, 
            id_alumno:id_alumno,meta_total:1, valor_actual:0}])
        .select();
    if (error) throw error;
}

const actualizar_objetivo = async (id_objetivo:number,titulo:string,descripcion?:string,fecha_limite?:Date) => {
    const {  error } = await supabase
        .from('Objetivos')
        .update({ titulo: titulo, descripcion: descripcion, fecha_limite: fecha_limite })
        .eq('id', id_objetivo)
        .select();
    if (error) throw error;
}

export {mis_objetivos_completados,mis_objetivos,crear_objetivo,actualizar_objetivo}