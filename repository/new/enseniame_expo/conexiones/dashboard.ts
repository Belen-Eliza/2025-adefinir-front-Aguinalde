import { supabase } from '../utils/supabase'

type HistorialRow = { senia_id: number;  created_at: string; modulo_nombre: string; senia_nombre: string };

const senias_historial = async (id_alumno:number) => {
    let res : HistorialRow[]=[]
    const { data, error } = await supabase
        .from('Alumno_Senia') 
        .select('*, Senias(*)')
        .eq('id_alumno', id_alumno)
        .eq("aprendida",true);
    if (error) throw error

    if (data){
        const { data: mods, error: modErr } = await supabase
            .from('Modulos')
            .select('id, nombre')
            .order('id', { ascending: true });
        if (modErr) throw modErr;
    }
    return res
}

export {senias_historial}