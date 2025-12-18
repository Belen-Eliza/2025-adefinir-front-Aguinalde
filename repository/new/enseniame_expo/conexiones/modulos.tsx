import { supabase } from '../utils/supabase'
import { icon_type, Logged_Alumno, Logged_Profesor, Modulo, Profesor, User } from '@/components/types'
import { router } from 'expo-router';
import { error_alert } from '@/components/alert';
import { visualizaciones_alumno } from './visualizaciones';

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
    //try {
        // Primero obtener los IDs de seña (id_video) del módulo
        //let { data: relaciones, error: relErr } = await supabase.from('Modulo_Video').select('id_video').eq("id_modulo",id);
        //if (relErr) throw relErr;
        
        let { data: id_senias, error } = await supabase.from('Modulo_Video').select(`Senias (id)`).eq("id_modulo",id);
        if (id_senias && id_senias.length>0) {
            const ids = (id_senias as any).map((each: any) => Number((each.Senias && each.Senias.id) ? each.Senias.id : each.id));
            let {data:senias,error} = await supabase.from("Senias").select(`*,  Users: Users!id_autor (*),  Categorias (nombre) `).in("id",ids);
            if (senias && senias.length>0) return senias
        }
       
}

const modulos_completados_por_alumno = async (id_alumno:number) =>{
    try {
        let { data: senias_aprendidas, error: errorSenias } = await supabase
            .from('Alumno_Senia')
            .select('senia_id')
            .eq('user_id', id_alumno)
            .eq('aprendida', true);
        
        if (errorSenias) throw errorSenias;
        
        if (senias_aprendidas && senias_aprendidas.length > 0) {
            const ids_senias_aprendidas = senias_aprendidas.map((s) => s.senia_id);
            
            let { data: modulos, error: errorModulos } = await supabase
                .from('Modulos')
                .select('id');
                
            if (errorModulos) throw errorModulos;
            
            if (modulos) {
                for (const modulo of modulos) {
                    let { data: senias_modulo, error: errorModuloSenias } = await supabase
                        .from('Modulo_Video')
                        .select('id_video')
                        .eq('id_modulo', modulo.id);
                    
                    if (errorModuloSenias) throw errorModuloSenias;
                    
                    if (senias_modulo && senias_modulo.length > 0) {
                        const ids_senias_modulo = senias_modulo.map((s) => s.id_video);
                        
                        const todas_aprendidas = ids_senias_modulo.every(id => 
                            ids_senias_aprendidas.includes(id)
                        );
                        
                        if (todas_aprendidas) {
                            let { data: modulo_alumno, error: errorModuloAlumno } = await supabase
                                .from('Alumno_Modulo')
                                .select('*')
                                .eq('id_alumno', id_alumno)
                                .eq('id_modulo', modulo.id)
                                .maybeSingle();
                            
                            if (errorModuloAlumno && errorModuloAlumno.code !== 'PGRST116') {
                                throw errorModuloAlumno;
                            }
                            
                            if (!modulo_alumno) {
                                const { error: errorInsert } = await supabase
                                    .from('Alumno_Modulo')
                                    .insert({
                                        id_alumno: id_alumno,
                                        id_modulo: modulo.id,
                                        completado: true
                                    });
                                
                                if (errorInsert) throw errorInsert;
                            } else if (!modulo_alumno.completado) {
                                const { error: errorUpdate } = await supabase
                                    .from('Alumno_Modulo')
                                    .update({ completado: true })
                                    .eq('id_alumno', id_alumno)
                                    .eq('id_modulo', modulo.id);
                                
                                if (errorUpdate) throw errorUpdate;
                            }
                        }
                    }
                }
            }
        }
        
        let { data, error } = await supabase
            .from('Alumno_Modulo')
            .select('id_modulo')
            .eq('id_alumno', id_alumno)
            .eq('completado', true);
            
        if (error) throw error;
        
        return data ? data.length : 0;
    } catch (error) {
        console.error('Error al obtener o actualizar módulos completados:', error);
        return 0;
    }
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



export {todos_los_modulos,buscar_modulo,buscar_senias_modulo, mis_modulos, eliminar_modulo, crear_modulo, editar_modulo,
    modulos_completados_por_alumno,progreso_por_categoria, mis_modulos_calificados
}
