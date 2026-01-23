import { supabase } from '../utils/supabase'

const aprendiendo_por_modulo = async (id_alumno:number, id_modulo:number) => {
    let res: any[] = [];
    let { data: Alumno_Senia, error } = await supabase
        .from('Alumno_Senia')
        .select('*, Senias(*,Modulo_Video(*)) ')
        .eq("id_alumno",id_alumno)
        .eq("aprendida",false);        
    if (error) throw error    
    if (Alumno_Senia && Alumno_Senia.length>0){        
        res = Alumno_Senia.filter(s=>s.Senias.Modulo_Video.find((m: { id_modulo: number; })=>m.id_modulo==id_modulo))
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

export {aprendiendo_por_modulo,aprendiendo_dominadas_por_modulo, aprendiendo_por_categoria,aprendiendo_dominadas_por_categoria,
    todas_por_categoria}