import { supabase } from '../lib/supabase'

const visualizaciones_profe = async (id:number)=>{
    
    let { data: Visualizaciones_Senias, error } = await supabase
    .from('Visualizaciones_Senias')
    .select('*, Senias!inner (*)')
    .eq('Senias.id_autor',id)
    if (error) throw error;
    if (Visualizaciones_Senias && Visualizaciones_Senias.length>0) return Visualizaciones_Senias
          
}

const visualizaciones_alumno = async (id:number)=>{
    let { data: Visualizaciones_Senias, error } = await supabase.from('Visualizaciones_Senias').select("*").eq("alumno",id);
    if (error)        throw error;
    if (Visualizaciones_Senias && Visualizaciones_Senias.length>0) return Visualizaciones_Senias
}

const senias_aprendidas_alumno = async (id: number) =>{
    const { data, error } = await supabase
        .from('Alumno_Senia')
        .select('senia_id, aprendida')
        .eq('user_id', id);
      if (error) throw error;
    if (data && data.length>0) return data
}

const now= ()=>{
    let ya = new Date();
    return ya.getFullYear().toString() +"-" + (ya.getMonth()+1).toString()+"-" + ya.getDate().toString()
}

const alumno_ver_senia = async (user_id:number,senia_id:number)=>{
    
    const { data, error } = await supabase
        .from('Visualizaciones_Senias')
        .insert([
            { alumno: user_id, senia: senia_id },
        ])
        .select();

    if (error) throw error;

    
    try {
        if (data && data.length>0){
            // verificar si eso completa el módulo
            const {data:modulo, error} = await supabase.from("Modulos").select('id, Modulo_Video!inner (*)').eq('Modulo_Video.id_video',senia_id);
            if (error) throw error
            if (modulo && modulo.length>0){
                let id_modulo =modulo[0].id;
                let completo = await modulo_completo(id_modulo, user_id)
                if (completo){
                    //sumar a tabla de módulo_alumno
                    const {  error } = await supabase
                        .from('Alumno_Modulo')
                        .insert([
                            { id_modulo: id_modulo, id_alumno: user_id, completado: true, fecha_completado: now()},
                        ])
                        
                    if (error) throw error
                    
                }
            }
        }
        
    } catch (error) {
        
    }
   
}

const modulo_completo = async (id_modulo:number, user_id: number)=>{
    const {data: videos_del_modulo, error} = await supabase.from('Modulo_Video').select("id_video").eq("id_modulo",id_modulo);
    if (error) throw error;

    const vistas = await visualizaciones_alumno(user_id);

    if (videos_del_modulo && videos_del_modulo.length>0){
        let cantidad_senias = videos_del_modulo.length;
        let cant_vistas_modulo = 0;
        vistas?.forEach(each =>{
            if (videos_del_modulo.find(value =>each.senia== value.id_video)  ) cant_vistas_modulo ++
        });
        if (cant_vistas_modulo==cantidad_senias) return true
        return false
    }
}

export {visualizaciones_profe, visualizaciones_alumno,alumno_ver_senia, senias_aprendidas_alumno}