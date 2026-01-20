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


export {traer_senias_practica}