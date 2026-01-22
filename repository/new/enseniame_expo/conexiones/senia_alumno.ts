import { supabase } from '../utils/supabase'
import { Senia_Alumno,Estado_Aprendiendo,Estado_Dominada,Estado_Pendiente,Estado_Senia } from '@/components/types'
type Senia_Modulo ={
  senia: Senia_Alumno;    
  descripcion?: string;
  aprendida:boolean
}

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

const traer_senias_modulo = async (id_alumno:number,id_modulo:number) => {
    const {data,error} = await supabase
        .from("Modulo_Video")
        .select("*,  Senias(*, Profesores(Users(username)), Categorias(nombre))")        
        .eq("id_modulo",id_modulo)

    if (error) throw error
    let res: Senia_Modulo[]= []
    if (data && data.length>0){        
        data.forEach(async each=>{
            let estado = await getEstado(id_alumno,each.id_video);
            let s =new Senia_Alumno(each.Senias,estado);
            res.push({senia:s,descripcion:each.descripcion,aprendida:s.estado.dominada()})
        })
    }
    return res
}


export {traer_senias_practica, sumar_acierto,marcar_dominada,getEstado,traer_senias_modulo}