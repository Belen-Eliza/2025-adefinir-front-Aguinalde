import { supabase } from '../lib/supabase'
import { icon_type } from '@/components/types'
import { error_alert } from '@/components/alert';
import { now } from '@/components/validaciones';
import { senias_aprendidas_alumno } from './visualizaciones';

const todos_los_modulos = async () =>{
    try {
        
        let { data: Modulos, error } = await supabase.from('Modulos').select('*');
          
        if (Modulos && Modulos.length>0) return Modulos
        if (error) throw new Error(String(error));
          
    } catch (error) {
        error_alert("Ocurrió un error al buscar los módulos");
        console.error(error)
    }
}

const buscar_modulo = async (id:number) =>{
    try {
        
        let { data: modulo, error } = await supabase.from('Modulos').select('*').eq('id',id);
          
        if (modulo && modulo.length>0) return modulo[0]
        if (error) throw new Error(String(error));
          
    } catch (error) {
        error_alert("Ocurrió un error al buscar el módulo");
        console.error(error)
    }
}

const buscar_senias_modulo = async (id:number)=>{
    
    let {data, error} = await supabase.from('Modulo_Video')
        .select("*, Senias(*, Users: Users!id_autor (*),  Categorias (nombre))")
        .eq("id_modulo",id);
    
    if (error) throw error
    
    return data
}


const modulos_completados_por_alumno = async (id_alumno:number) =>{
    let { data, error } = await supabase
        .from('Alumno_Modulo')
        .select('id_modulo')
        .eq('id_alumno', id_alumno)
        .eq('completado', true);
        
    if (error) throw error;
    
    return data ? data.length : 0;
}

const progreso_por_categoria = async (id_alumno:number) =>{

    try {
        let { data: categorias, error: errorCategorias } = await supabase
            .from('Categorias')
            .select('id, nombre');
        
        if (errorCategorias) throw errorCategorias;
        if (!categorias || categorias.length === 0) return [];

        const resultados = [];

        for (const categoria of categorias) {
            // Traer todas las señas de la categoría
            let { data: senias_categoria, error: errorSeniasCat } = await supabase
                .from('Senias')
                .select('id')
                .eq('categoria', categoria.id);
            
            if (errorSeniasCat) throw errorSeniasCat;
            if (!senias_categoria || senias_categoria.length === 0) {
                resultados.push({ categoriaId: categoria.id, nombre: categoria.nombre, porcentaje: 0 });
                continue;
            }

            const ids_senias_categoria = senias_categoria.map(s => s.id);
            
            // Traer las señas aprendidas por el alumno en esa categoría
            let { data: senias_aprendidas, error: errorSeniasApr } = await supabase
                .from('Alumno_Senia')
                .select('senia_id')
                .eq('user_id', id_alumno)
                .in('senia_id', ids_senias_categoria);
            
            if (errorSeniasApr) throw errorSeniasApr;

            const porcentaje = senias_aprendidas ? Math.ceil((senias_aprendidas.length / ids_senias_categoria.length) * 100) : 0;
            resultados.push({ categoriaId: categoria.id, nombre: categoria.nombre, porcentaje });
        }

        // Ordenar resultados de mayor a menor porcentaje
        resultados.sort((a, b) => b.porcentaje - a.porcentaje);

        return resultados;
    } catch (error) {
        console.error('Error al obtener progreso por categoría:', error);
        return [];
    }
}

const mis_modulos = async (id:number)=>{
    let { data: Modulos, error } = await supabase
        .from('Modulos')
        .select('*')
        .eq('autor',id);
    if (error) throw error;
    if (Modulos && Modulos.length>0) return Modulos         
}

const mis_modulos_calificados= async (id:number)=>{
    let { data: Modulos, error } = await supabase
        .from('Modulos')
        .select('*, Calificaciones_Modulos (*)')
        .eq('autor',id);
    if (error) throw error;
    if (Modulos && Modulos.length>0) return Modulos 
}

const eliminar_modulo = async (id:number)=>{
    const { error } = await supabase.from('Modulos').delete().eq('id', id);
    if (error) throw error
}

const crear_modulo = async (nombre: string, descripcion: string, icon: icon_type, autor: number)=>{
    const { error } = await supabase.from("Modulos")
        .insert([{ nombre, descripcion, icon, autor }]);
    if (error) throw error;
    return true
}

const editar_modulo = async (id: number,nombre:string,descripcion:string,icon: icon_type)=>{
    const { error } = await supabase
        .from("Modulos")
        .update({ nombre, descripcion, icon })
        .eq("id", id);
    if (error) throw error;
    return true
}

const completar_modulo_alumno = async (id_alumno:number,id_modulo:number) =>{
    
    const completado = await alumno_completo_modulo(id_alumno,id_modulo);    
    const s  = await buscar_senias_modulo(id_modulo); //id_video
    const aprendidas = await senias_aprendidas_alumno(id_alumno); //senia_id
    
    let  continuar = true;
    s?.forEach(each=>{
        if (aprendidas?.find(v=>v.senia_id==each.id_video)==undefined) continuar = false
    });
    
    if (!completado && continuar){        
        //verificar si existe el registro
        let { data, error } = await supabase
            .from('Alumno_Modulo')
            .select('id_modulo')
            .eq('id_alumno', id_alumno)
            .eq("id_modulo",id_modulo);

        if (error) throw error;

        if (data && data.length>0) {
            const { data:d,error } = await supabase
                .from('Alumno_Modulo')
                .update({ completado: true, fecha_completado:now() })
                .eq('id_alumno', id_alumno)            
                .eq('id_modulo', id_modulo)
                
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('Alumno_Modulo')
                .insert({ id_modulo: id_modulo, id_alumno:id_alumno,completado:true, fecha_completado:now() })
                
            if (error) throw error
        }
    }   
}

const alumno_completo_modulo = async (id_alumno:number,id_modulo:number) => {
    let { data, error } = await supabase
            .from('Alumno_Modulo')
            .select('id_modulo')
            .eq('id_alumno', id_alumno)
            .eq("id_modulo",id_modulo)
            .eq('completado', true);
            
        if (error) throw error;
        if (data && data.length>0) return true
        return false
}

const mis_modulos_completos = async (id_alumno:number) => {
    let { data, error } = await supabase
        .from('Alumno_Modulo')
        .select('id_modulo')
        .eq('id_alumno', id_alumno)            
        .eq('completado', true);
        
    if (error) throw error;
    
    return data && data.length>0 ? data : [];
}

const sumar_descripcion_senia_modulo = async (id_modulo:number,id_senia:number,desc:string) => {
    
    const { data, error } = await supabase
        .from('Modulo_Video')
        .update({ descripcion: desc })
        .eq('id_modulo', id_modulo)
        .eq("id_video",id_senia)
        .select()
    if (error) throw error;
    console.log(data)
}


export {todos_los_modulos,buscar_modulo,buscar_senias_modulo, mis_modulos, eliminar_modulo, crear_modulo, editar_modulo,
    modulos_completados_por_alumno,progreso_por_categoria, mis_modulos_calificados, completar_modulo_alumno, alumno_completo_modulo,
    mis_modulos_completos, sumar_descripcion_senia_modulo
}
