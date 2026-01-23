import { supabase } from '../utils/supabase'
import { cantidad_aprendidas } from './aprendidas';

type HistorialRow = { senia_id: number;  updated_at: Date ; categoria: string; senia_nombre: string };
type ProgresoGlobal = {learned:number,total:number}

const senias_historial = async (id_alumno:number) => {
    let res : HistorialRow[]=[]
    const { data, error } = await supabase
        .from('Alumno_Senia') 
        .select('*, Senias(*,Categorias(*))')
        .eq('id_alumno', id_alumno)
        .eq("aprendida",true)
        .order("updated_at",{ascending:false});
    if (error) throw error

    if (data && data.length>0){
        res = data.map(senia=>{
            let date = senia.updated_at ? new Date(senia.updated_at) : new Date()
            return {senia_id:senia.senia_id,updated_at:date,categoria:senia.Senias.Categorias.nombre,senia_nombre:senia.Senias.significado}
        })
    }
    return res
}

const mi_progreso_global = async (id_alumno:number) => {
    let res: ProgresoGlobal = {learned:0,total:0};

    //buscar la cantidad de señas en total
    let { data: Senias, error } = await supabase
        .from('Senias')
        .select('*')
    if (error) throw error
    if (Senias && Senias.length>0){
        res.total=Senias.length;
    }

    //cantidad aprendidas/dominadas
    let cant = await cantidad_aprendidas(id_alumno);
    res.learned=cant
    return res
}

export {senias_historial,mi_progreso_global}