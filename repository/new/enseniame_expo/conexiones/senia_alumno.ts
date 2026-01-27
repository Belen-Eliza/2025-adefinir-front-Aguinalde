import { supabase } from '../utils/supabase'
import { Senia_Alumno,Estado_Aprendiendo,Estado_Dominada,Estado_Pendiente,Estado_Senia } from '@/components/types'
import { buscar_senias_modulo } from './modulos';
import { senias_alumno } from './aprendidas';

type Senia_Modulo ={
  senia: Senia_Alumno;    
  descripcion?: string;
  aprendida:boolean
}
type Senia_Leccion ={
  senia: Senia_Alumno;    
  descripcion?: string;
  aprendiendo: boolean;
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

const traer_senias_leccion = async (id_alumno:number,id_modulo:number) => {
    const senias_modulo = await buscar_senias_modulo(id_modulo);
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Leccion[] = [];
    senias_modulo?.forEach(s=>{
        let estado = getEstadoSync(s.id_video,senias_al);
        let senia = new Senia_Alumno(s.Senias,estado);
        res.push({senia:senia,descripcion:s.descripcion,aprendiendo:estado.esta_aprendiendo()})
    })
    return res
}

const traer_senias_leccion_aprendiendo = async (id_alumno:number,id_modulo:number) => {
    const senias_modulo = await buscar_senias_modulo(id_modulo);
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Leccion[] = [];
    senias_modulo?.forEach(s=>{
        let estado = getEstadoSync(s.id_video,senias_al);
        let senia = new Senia_Alumno(s.Senias,estado);
        if (estado.esta_aprendiendo()){
            res.push({senia:senia,descripcion:s.descripcion,aprendiendo:estado.esta_aprendiendo()});
        }        
    })
    return res
}

const traer_senias_leccion_aprendiendo_dominadas = async (id_alumno:number,id_modulo:number) => {
    const senias_modulo = await buscar_senias_modulo(id_modulo);
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Leccion[] = [];
    senias_modulo?.forEach(s=>{
        let estado = getEstadoSync(s.id_video,senias_al);
        let senia = new Senia_Alumno(s.Senias,estado);
        if (estado.toString()!="Pendiente"){
            res.push({senia:senia,descripcion:s.descripcion,aprendiendo:estado.esta_aprendiendo()});
        }        
    })
    return res
}

const getEstadoSync = (id_senia:number,senias: {id_senia:number,aprendida:boolean,cant_aciertos:number}[])=>{
    let e = new Estado_Pendiente();
    let aux =senias.find(v=>v.id_senia==id_senia);
    if (aux){
        if (aux.aprendida) e = new Estado_Dominada();
        else e= new Estado_Aprendiendo(aux.cant_aciertos)
    }

    return e
}


export {traer_senias_practica, sumar_acierto,marcar_dominada,getEstado,traer_senias_modulo,
    traer_senias_leccion, traer_senias_leccion_aprendiendo, traer_senias_leccion_aprendiendo_dominadas}