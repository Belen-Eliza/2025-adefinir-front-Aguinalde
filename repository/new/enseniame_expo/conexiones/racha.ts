import { supabase } from '../utils/supabase'

const mi_racha=async (id_alumno:number)=>{
    let { data, error } = await supabase
        .from('Alumnos')
        .select('racha,racha_maxima,last_login')
        .eq("id",id_alumno).single()
    if (error) throw error
    return data? data : {racha:0,racha_maxima:0,last_login: new Date()}
}

const sumar_racha= async (id_alumno:number) =>{
    //verificar si hay racha
    let { data: Alumno, error } = await supabase
        .from('Alumnos')
        .select('*')
        .eq("id",id_alumno).single()
    if (error) throw error
    if (Alumno){
        
        let racha_nueva = Alumno.racha+1; 
        if (racha_nueva>Alumno.racha_maxima) {
            const { error } = await supabase
                .from('Alumnos')
                .update({ racha: racha_nueva, last_login: new Date(), racha_maxima: racha_nueva })
                .eq('id', id_alumno);                
            if (error) throw error
        }   else {
            const { error } = await supabase
                .from('Alumnos')
                .update({ racha: racha_nueva, last_login: new Date() })
                .eq('id', id_alumno);                
            if (error) throw error
        } 
        //sumar el xp
        const { error } = await supabase
            .from('Alumnos')
            .update({ xp: Alumno.xp + racha_nueva*2 })
            .eq('id', id_alumno);                
        if (error) throw error
    } 
}

const perder_racha = async (id_alumno:number) => {
    const { error } = await supabase
        .from('Alumnos')
        .update({ racha: 1, last_login: new Date() })
        .eq('id', id_alumno)
        .select()
    if (error) throw error    
}

export {mi_racha, sumar_racha, perder_racha}