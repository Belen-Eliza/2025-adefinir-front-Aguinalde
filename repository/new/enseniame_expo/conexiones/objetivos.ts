import { supabase } from '../utils/supabase'
const ahora = new Date();
const mesActual = ahora.getMonth() + 1; // 1..12
const anioActual = ahora.getFullYear();

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

const crear_objetivo_mensual = async (id_alumno:number,cant:number,progreso:number,comp:boolean) => {
    
    const { data, error } = await supabase
        .from('Objetivos_Mensuales')
        .upsert({ user_id: id_alumno, mes: mesActual, anio: anioActual, meta_mensual: cant, progreso_actual: progreso, completado: comp }, 
            { onConflict: 'user_id,mes,anio' })
        .select()
        .single();
    if (error) throw error;
    return data
}

const mi_objetivo_mensual = async (id_alumno:number) => {
    const { data: objs, error: objErr } = await supabase
        .from('Objetivos_Mensuales')
        .select('*')
        .eq('user_id', id_alumno)
        .eq('mes', mesActual)
        .eq('anio', anioActual)
        //.order('updated_at', { ascending: false })
        .limit(1);
    if (objErr) throw objErr;
    return objs
}

export {mis_objetivos_completados,mis_objetivos,crear_objetivo,actualizar_objetivo,
    crear_objetivo_mensual, mi_objetivo_mensual
}