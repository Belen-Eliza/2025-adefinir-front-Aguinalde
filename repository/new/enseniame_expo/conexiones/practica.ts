import { supabase } from '../utils/supabase'
import { Estado_Aprendiendo, Estado_Dominada, Estado_Pendiente, Senia_Alumno } from '@/components/types';
import { senias_alumno } from './aprendidas';
import { getEstadoSync, traer_senias_leccion, traer_senias_leccion_aprendiendo, traer_senias_leccion_aprendiendo_dominadas } from './senia_alumno';

type Senia_Leccion ={
  senia: Senia_Alumno;    
  descripcion?: string;
  aprendiendo: boolean;
}

const todas_por_modulo = async (id_alumno:number, id_modulo:number) =>{
    let res: Senia_Alumno[] = [];

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


    return res
}


const traer_senias_practica_x_cate = async (id_alumno:number,id_categoria:number) => {
    
    let { data: senias_cate, error } = await supabase
        .from('Senias')
        .select('*, Profesores(*,Users(*)),  Categorias (nombre)')
        .eq("categoria",id_categoria);
    if (error) throw error
          
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Alumno[] = [];
    senias_cate?.forEach(s=>{
        let estado = getEstadoSync(s.id,senias_al);
        let senia = new Senia_Alumno(s,estado);
        res.push(senia);
    })
    return res
}

const aprendiendo_practica_x_cate = async (id_alumno:number,id_cate:number) => {
     let { data: senias_cate, error } = await supabase
        .from('Senias')
        .select('*, Profesores(*,Users(*)),  Categorias (nombre)')
        .eq("categoria",id_cate);
    if (error) throw error
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Alumno[] = [];
    senias_cate?.forEach(s=>{
        let estado = getEstadoSync(s.id,senias_al);
        let senia = new Senia_Alumno(s,estado);
        if (estado.esta_aprendiendo()){
            res.push(senia);
        }        
    })
    return res
}
const aprendiendo_dominadas_practica_x_cate = async (id_alumno:number,id_cate:number) => {
     let { data: senias_cate, error } = await supabase
        .from('Senias')
        .select('*, Profesores(*,Users(*)),  Categorias (nombre)')
        .eq("categoria",id_cate);
    if (error) throw error
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Alumno[] = [];
    senias_cate?.forEach(s=>{
        let estado = getEstadoSync(s.id,senias_al);
        let senia = new Senia_Alumno(s,estado);
        if (estado.toString()!="Pendiente"){
            res.push(senia);
        }        
    })
    return res
}

const traer_senias_leccion_x_cate = async (id_alumno:number,id_categoria:number) => {
    let { data: senias_cate, error } = await supabase
        .from('Senias')
        .select('*, Profesores(*,Users(*)),  Categorias (nombre)')
        .eq("categoria",id_categoria);
    if (error) throw error
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Leccion[] = [];
    senias_cate?.forEach(s=>{
        let estado = getEstadoSync(s.id,senias_al);
        let senia = new Senia_Alumno(s,estado);
        res.push({senia:senia,descripcion:s.descripcion,aprendiendo:estado.esta_aprendiendo()})
    })
    return res
}
const aprendiendo_leccion_x_cate = async (id_alumno:number,id_categoria:number) => {
    let { data: senias_cate, error } = await supabase
        .from('Senias')
        .select('*, Profesores(*,Users(*)),  Categorias (nombre)')
        .eq("categoria",id_categoria);
    if (error) throw error
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Leccion[] = [];
    senias_cate?.forEach(s=>{
        let estado = getEstadoSync(s.id,senias_al);
        let senia = new Senia_Alumno(s,estado);
        if (estado.esta_aprendiendo())   res.push({senia:senia,descripcion:s.descripcion,aprendiendo:estado.esta_aprendiendo()})
    })
    return res
}

const aprendiendo_dominadas_leccion_x_cate = async (id_alumno:number,id_categoria:number) => {
    let { data: senias_cate, error } = await supabase
        .from('Senias')
        .select('*, Profesores(*,Users(*)),  Categorias (nombre)')
        .eq("categoria",id_categoria);
    if (error) throw error
    const senias_al = await senias_alumno(id_alumno);    
    let res: Senia_Leccion[] = [];
    senias_cate?.forEach(s=>{
        let estado = getEstadoSync(s.id,senias_al);
        let senia = new Senia_Alumno(s,estado);
        if (estado.toString()!="Pendiente")   res.push({senia:senia,descripcion:s.descripcion,aprendiendo:estado.esta_aprendiendo()})
    })
    return res
}

const hay_senias_practica = async (id_alumno:number, por_categoria:boolean,opcion:number,id_cate_modulo:number) => {
    let s: any[] =[];    

    if (por_categoria){
        if (opcion==2) s = await  aprendiendo_practica_x_cate(id_alumno,id_cate_modulo)
        else if (opcion==3) s = await aprendiendo_dominadas_practica_x_cate(id_alumno,id_cate_modulo);
        else s= await traer_senias_practica_x_cate(id_alumno,id_cate_modulo);
    } else {
        if (opcion==2) s = await  traer_senias_leccion_aprendiendo(id_alumno,id_cate_modulo)
        else if (opcion==3) s = await traer_senias_leccion_aprendiendo_dominadas(id_alumno,id_cate_modulo);
        else s= await traer_senias_leccion(id_alumno,id_cate_modulo);
    }

    return s.length!=0
}
export { todas_por_modulo, traer_senias_practica_x_cate, aprendiendo_practica_x_cate, aprendiendo_dominadas_practica_x_cate,
    traer_senias_leccion_x_cate, aprendiendo_leccion_x_cate, aprendiendo_dominadas_leccion_x_cate, hay_senias_practica
}