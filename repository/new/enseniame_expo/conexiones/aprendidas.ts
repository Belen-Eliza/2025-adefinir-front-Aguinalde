import { supabase } from '../utils/supabase'
import { buscar_senias_modulo, completar_modulo_alumno } from './modulos';

const marcar_aprendida = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
        .from('Alumno_Senia')
        .upsert(
        [{ id_alumno: id_alumno, id_senia: id_senia, aprendida: true }],
        { onConflict: 'id_alumno,id_senia' }
        )
    if (error) throw error;
    // ver si eso completa un módulo
    // traer todos los módulos con esa seña
        
    let { data: Modulo_Video, error:error_m } = await supabase
        .from('Modulo_Video')
        .select('*')
        .eq("id_video",id_senia);
    if (error_m) throw error_m
    
    if (Modulo_Video && Modulo_Video.length>0){
        Modulo_Video.forEach(async modulo =>{
            //sumar una seña aprendida
                                
            let { data: Alumno_Modulo, error: error_a } = await supabase
                .from('Alumno_Modulo')
                .select('*')
                .eq("id_modulo",modulo.id_modulo)
                .eq("id_alumno",id_alumno)
                .maybeSingle();
            let cant_aprendidas =1;
            if (Alumno_Modulo) {
                const {  error } = await supabase
                    .from('Alumno_Modulo')
                    .update({ cant_senias_dominadas: Alumno_Modulo.cant_senias_dominadas+1 })
                    .eq('id_modulo', modulo.id_modulo)
                    .eq("id_alumno",id_alumno);
                if (error) throw error
                cant_aprendidas =Alumno_Modulo.cant_senias_dominadas+1;
            } else {                                
                const { error } = await supabase
                    .from('Alumno_Modulo')
                    .insert([
                        { id_alumno: id_alumno, id_modulo: modulo.id_modulo,completado:false,cant_senias_dominadas:1 },
                    ]) ;
                    if (error) throw error                 
            }
            //comparar la cantidad de aprendidas con la cantidad en el modulo
            const s = await buscar_senias_modulo(modulo.id_modulo)
            if (s && s.length==cant_aprendidas){
                //caso afirmativo 
                await completar_modulo_alumno(id_alumno,modulo.id_modulo);
            }            
        })
    }

    
}

const marcar_aprendiendo = async (id_senia:number, id_alumno:number)=>{
    const { error } = await supabase
        .from('Alumno_Senia')
        .upsert(
        [{ id_alumno: id_alumno, id_senia: id_senia, aprendida: false, cant_aciertos:0 }],
        { onConflict: 'id_alumno,id_senia' }
        )
    if (error) throw error;
}

const marcar_pendiente = async (id_senia:number, id_alumno:number)=>{
        
    const { error } = await supabase
        .from('Alumno_Senia')
        .delete()
        .eq('id_senia', id_senia)
        .eq('id_alumno',id_alumno)
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



export {marcar_aprendida, marcar_no_aprendida, cantidad_aprendidas,senias_alumno, marcar_aprendiendo,marcar_pendiente,
    mis_senias_dominadas,mis_senias_aprendiendo,mis_senias_pendientes,sumar_acierto}