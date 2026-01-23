import { supabase } from '../utils/supabase'

type HistorialRow = { senia_id: number;  updated_at: Date ; categoria: string; senia_nombre: string };

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

export {senias_historial}