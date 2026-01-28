import { supabase } from '../utils/supabase'
import { Estado_Aprendiendo, Estado_Dominada, Estado_Pendiente, Senia_Alumno } from '@/components/types';
import { senias_alumno } from './aprendidas';
import { getEstadoSync } from './senia_alumno';

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

const aprendiendo_por_modulo = async (id_alumno:number, id_modulo:number) => {
    let res: any[] = [];
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*, Senias(*,Modulo_Video(*)) ')
        .eq("id_alumno",id_alumno)
        .eq("aprendida",false);        
    if (error) throw error    
    if (Alumno_Senia && Alumno_Senia.length>0){        
        let filtradas = Alumno_Senia.filter(s=>s.Senias.Modulo_Video.find((m: { id_modulo: number; })=>m.id_modulo==id_modulo));
        res = filtradas.map(e=>{
            let estado = new Estado_Pendiente();
            if (e.aprendida){                
                estado = new Estado_Dominada()
            } else {
                estado = new Estado_Aprendiendo(e.cant_aciertos);
            }
            return new Senia_Alumno(e.Senias,estado)
        })
    }
    console.log(res)
    return res
}


const aprendiendo_dominadas_por_modulo = async (id_alumno:number, id_modulo:number) => {
    let res: any[] = [];
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*, Senias(*,Modulo_Video(*)) ')
        .eq("id_alumno",id_alumno)                
    if (error) throw error
    if (Alumno_Senia && Alumno_Senia.length>0){        
        res = Alumno_Senia.filter(s=>s.Senias.Modulo_Video.find((m: { id_modulo: number; })=>m.id_modulo==id_modulo))
    }    
    return res
}

const aprendiendo_por_categoria = async (id_alumno:number, id_categoria:number) => {  
    let res: any[] = [];  
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*, Senias(*) ')
        .eq("id_alumno",id_alumno)  
        .eq("aprendida",false);                       
    if (error) throw error
    if (Alumno_Senia && Alumno_Senia.length>0){        
        res = Alumno_Senia.filter(s=>s.Senias.categoria==id_categoria)
    }  
    console.log(res)
    return res
}

const aprendiendo_dominadas_por_categoria = async (id_alumno:number, id_categoria:number) => {  
    let res: any[] = [];  
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*, Senias(*) ')
        .eq("id_alumno",id_alumno)                      
    if (error) throw error
    if (Alumno_Senia && Alumno_Senia.length>0){        
        res = Alumno_Senia.filter(s=>s.Senias.categoria==id_categoria)
    }  
    console.log(res)
    return res
}

const todas_por_categoria = async (id_cate:number) => {
    
    let { data: Senias, error } = await supabase
        .from('Senias')
        .select('*')
        .eq("categoria",id_cate)
    if (error) throw error
    console.log(Senias)
    return Senias
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

export {aprendiendo_por_modulo,aprendiendo_dominadas_por_modulo, aprendiendo_por_categoria,aprendiendo_dominadas_por_categoria,
    todas_por_categoria, todas_por_modulo, traer_senias_practica_x_cate}