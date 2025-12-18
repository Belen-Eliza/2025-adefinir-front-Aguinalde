import { supabase } from '../lib/supabase'

const mi_racha = async (id_alumno:number) => {
    
    let { data: Alumno_Racha, error } = await supabase
        .from('Alumno_Racha')
        .select('*')
        .eq("id_alumno",id_alumno);
    if (error) throw error

    if (Alumno_Racha && Alumno_Racha.length>0) return Alumno_Racha[0]
    else {
        const { data, error } = await supabase
            .from('Alumno_Racha')
            .insert([
                { id_alumno: id_alumno, racha: 1,last_login: new Date() },
            ])
            .select()
            .single()
        if (error) throw error
        return data
    }
}

const sumar_racha= async (id_alumno:number) =>{
    //verificar si hay racha
    let { data: Alumno_Racha, error } = await supabase
        .from('Alumno_Racha')
        .select('*')
        .eq("id_alumno",id_alumno);
    if (error) throw error
    if (Alumno_Racha && Alumno_Racha.length>0){
        let r =Alumno_Racha[0];
        let racha_nueva = r.racha+1; 
        if (racha_nueva>r.racha_maxima) {
            const { error } = await supabase
                .from('Alumno_Racha')
                .update({ racha: racha_nueva, last_login: new Date(), racha_maxima: racha_nueva })
                .eq('id_alumno', id_alumno)
                .select()
            if (error) throw error
        }   else {
            const { error } = await supabase
                .from('Alumno_Racha')
                .update({ racha: racha_nueva, last_login: new Date() })
                .eq('id_alumno', id_alumno)
                .select()
            if (error) throw error
    } 
                        
    } else {        
        const { data, error } = await supabase
            .from('Alumno_Racha')
            .insert([
                { id_alumno: id_alumno, racha: 1,last_login: new Date() },
            ])
            .select()
        if (error) throw error
        console.log(data)
    }
}

const perder_racha = async (id_alumno:number) => {
    const { data, error } = await supabase
        .from('Alumno_Racha')
        .update({ racha: 1, last_login: new Date() })
        .eq('id_alumno', id_alumno)
        .select()
    if (error) throw error
    console.log(data)
}

export {mi_racha, sumar_racha, perder_racha}