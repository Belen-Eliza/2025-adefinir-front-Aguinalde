import { supabase } from '../utils/supabase'

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
        .select('id_senia, aprendida')
        .eq('id_alumno', id);
      if (error) throw error;
    if (data && data.length>0) return data
}

const now= ()=>{
    let ya = new Date();
    return ya.getFullYear().toString() +"-" + (ya.getMonth()+1).toString()+"-" + ya.getDate().toString()
}

const alumno_ver_senia = async (user_id:number,senia_id:number)=>{
    //verificar si el registro existe
    const { data, error } = await supabase
        .from('Visualizaciones_Senias')
        .select("*")
        .eq("alumno",user_id)
        .eq("senia",senia_id)
        .maybeSingle()

    if (error) throw error;
    if (!data){
        const {  error:error2 } = await supabase
            .from('Visualizaciones_Senias')
            .insert([
                { alumno: user_id, senia: senia_id },
            ])
            .select();

        if (error2) throw error2;
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