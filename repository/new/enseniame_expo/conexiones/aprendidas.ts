import { supabase } from '../utils/supabase'

const marcar_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
        .from('Alumno_Senia')
        .upsert(
        [{ id_alumno: id_alumno, id_senia: id_senia, aprendida: true }],
        { onConflict: 'id_alumno,id_senia' }
        )
    if (error) throw error;
}

const marcar_no_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
          .from('Alumno_Senia')
          .update({ aprendida: false })
          .eq('id_alumno', id_alumno)
          .eq('id_senia', id_senia);
    if (error) throw error;
}

const cantidad_aprendidas = async (id_alumno:number) => {
    
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*')
        .eq("id_alumno",id_alumno)
        .eq("aprendida",true)
    if (error) throw error;
    if (Alumno_Senia) return Alumno_Senia.length
    return 0
}

const senias_alumno = async (id_alumno:number) => {
    const { data, error } = await supabase
        .from('Alumno_Senia') 
        .select('*')
        .eq('id_alumno', id_alumno);
    if (error) throw error
    return data
}

const mis_senias_dominadas= async (id_alumno:number) => {
    const { data, error } = await supabase
        .from('Senias') 
        .select('*, Alumno_Senia(*)')
        .eq('Alumno_Senia.id_alumno', id_alumno)
        .eq("Alumno_Senia.aprendida",true);
    if (error) throw error
    return data
}
const mis_senias_pendientes= async (id_alumno:number) => {
    //revisar
    return []
}
const mis_senias_aprendiendo= async (id_alumno:number) => {
    const { data, error } = await supabase
        .from('Senias') 
        .select('*, Alumno_Senia(*)')
        .eq('Alumno_Senia.id_alumno', id_alumno)
        .eq("Alumno_Senia.aprendida",false);
    if (error) throw error
    return data
}

const sumar_acierto = async (id_alumno:number,id_senia:number) => {
    const {data:senia,error:error1} = await supabase.from("Alumno_Senia").select("cant_aciertos")
        .eq("id_alumno",id_alumno)
        .eq("id_senia",id_senia)
        .single();
    if (error1) throw error1

    if (senia){
        const { data, error } = await supabase
            .from('Alumno_Senia')
            .update({ cant_aciertos: senia.cant_aciertos+1 })
            .eq("id_alumno",id_alumno)
            .eq("id_senia",id_senia);
        if (error) throw error
    }              
}

export {marcar_aprendida, marcar_no_aprendida, cantidad_aprendidas,senias_alumno,
    mis_senias_dominadas,mis_senias_aprendiendo,mis_senias_pendientes,sumar_acierto}