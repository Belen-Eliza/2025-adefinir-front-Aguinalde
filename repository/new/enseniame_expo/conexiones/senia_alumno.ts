import { supabase } from '../utils/supabase'
import { Senia_Alumno,Estado_Aprendiendo,Estado_Dominada,Estado_Pendiente,Estado_Senia } from '@/components/types'

const traer_senias_practica = async (id_alumno:number) => {
    const {data,error} = await supabase.from("Alumno_Senia").select("*, Senias(*)").eq("id_alumno",id_alumno);
    if (error) throw error

    if (data && data.length>0){
        //armar los objetos        
        const s = data.map(e=>{
            let estado = new Estado_Pendiente();
            if (e.aprendida){                
                estado = new Estado_Dominada()
            } else {
                estado = new Estado_Aprendiendo(e.cant_aciertos);
            }
            return new Senia_Alumno(e.Senias,estado)
        })
        return s
    }
    return []
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

const marcar_dominada = async (id_alumno:number,id_senia:number) => {
    const { error } = await supabase
        .from('Alumno_Senia')
        .update({ aprendida:true })
        .eq("id_alumno",id_alumno)
        .eq("id_senia",id_senia);
    if (error) throw error
}

const getEstado = async (id_alumno:number,id_senia:number) => {
    const {data,error} = await supabase
        .from("Alumno_Senia")
        .select("*")
        .eq("id_alumno",id_alumno)
        .eq("id_senia",id_senia)
        .maybeSingle();
    if (error) throw error

    if (data ){              
        let estado = new Estado_Pendiente();
        if (data.aprendida){                
            estado = new Estado_Dominada();
        } else {
            estado = new Estado_Aprendiendo(data.cant_aciertos);
        }
        return estado                
    }
    return new Estado_Pendiente();
}


export {traer_senias_practica, sumar_acierto,marcar_dominada,getEstado}