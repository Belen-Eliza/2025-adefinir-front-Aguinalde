import { supabase } from '../utils/supabase'

const traerMotivosReporte = async ()=>{
    
    let { data: Motivos_reporte, error } = await supabase
        .from('Motivos_reporte')
        .select('*')
    if (error) throw error
    return Motivos_reporte
}

const crearReporte = async (id_autor:number,id_motivo:number,comentario:string,id_senia:number)=>{
    const { error } = await supabase
        .from('Reportes')
        .insert([
            { id_senia: id_senia, id_profe: id_autor, motivo:id_motivo, comentario:comentario },
        ])
        .select()
    if (error) throw error
}

const traerReportesProfe = async (id_profe: number) => {
    let { data, error } = await supabase
        .from('Senias')
        .select('id')
        .eq('id_autor', id_profe);
    if (error) throw error;

    const seniaIds = data?.map((senia) => senia.id) || [];

    let { data: data2, error: error2 } = await supabase
        .from('Reportes')
        .select(`
            id,
            id_senia,
            motivo,
            comentario,
            Motivos_reporte (
                descripcion
            ),
            Senias (
                id,
                significado,
                video_url,
                categoria
            )
        `)
        .in('id_senia', seniaIds);

    if (error2) throw error2;
    return data2;
}

const todosReportes = async () => {
    
    let { data: Reportes, error } = await supabase.from('Reportes')
        .select('*, Motivos_reporte(*), Senias (*, Profesores (*,Users(*)),  Categorias (nombre))');
    if (error) throw error
    return Reportes
}

const eliminarReporte = async (id:number) => {
 
    const { error } = await supabase
        .from('Reportes')
        .delete()
        .eq('id', id);
    if (error) throw error
}

export {traerMotivosReporte, crearReporte, todosReportes, eliminarReporte,traerReportesProfe}