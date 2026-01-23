import { supabase } from '../utils/supabase'
import { cantidad_aprendidas, mis_senias_dominadas } from './aprendidas';
import { buscar_senias_modulo } from './modulos';

type HistorialRow = { senia_id: number;  updated_at: Date ; categoria: string; senia_nombre: string };
type ProgresoGlobal = {learned:number,total:number};
type ProgresoPorModulo ={ id: number; nombre: string; total: number; learned: number };

const senias_historial = async (id_alumno:number) => {
    let res : HistorialRow[]=[]
    const { data, error } = await supabase
        .from('Alumno_Senia') 
        .select('*, Senias(*,Categorias(*))')
        .eq('id_alumno', id_alumno)
        .eq("aprendida",true)
        .order("updated_at",{ascending:false});
    if (error) throw error

    if (data && data.length>0){
        res = data.map(senia=>{
            let date = senia.updated_at ? new Date(senia.updated_at) : new Date()
            return {senia_id:senia.senia_id,updated_at:date,categoria:senia.Senias.Categorias.nombre,senia_nombre:senia.Senias.significado}
        })
    }
    return res
}

const mi_progreso_global = async (id_alumno:number) => {
    let res: ProgresoGlobal = {learned:0,total:0};

    //buscar la cantidad de señas en total
    let { data: Senias, error } = await supabase
        .from('Senias')
        .select('*')
    if (error) throw error
    if (Senias && Senias.length>0){
        res.total=Senias.length;
    }

    //cantidad aprendidas/dominadas
    let cant = await cantidad_aprendidas(id_alumno);
    res.learned=cant
    return res
}

const mi_progreso_x_modulo = async (id_alumno:number) => {
    let res :ProgresoPorModulo[] = [];

    //todos los módulos        
    let { data: Modulos, error:error_m } = await supabase
        .from('Modulos')
        .select('*, Modulo_Video(count)')
    if (error_m) throw error_m

    //todas las señas de modulos                
    let { data: Modulo_Video, error: error_s } = await supabase
        .from('Modulo_Video')
        .select('*');
    if (error_s) throw error_s

    //todas las señas aprendidas
    let mis_senias_d = await mis_senias_dominadas(id_alumno);
    if (Modulos && Modulos.length>0 && mis_senias_d && mis_senias_d.length>0 && Modulo_Video && Modulo_Video.length>0){    
                  
        Modulos.forEach( m=>{
            let learned=0;
            //todas las señas del módulo            
            let senias_modulo = Modulo_Video.filter(each => each.id_modulo==m.id);
            //las que fueron aprendidas
            let aux= senias_modulo.filter(each=>mis_senias_d.find(mis_s=>mis_s.id_senia==each.id_senia))

            res.push({id:m.id,nombre:m.nombre,total:m.Modulo_Video[0].count,learned:aux.length})
        })
    }
    console.log(res)
    return res
}

export {senias_historial,mi_progreso_global,mi_progreso_x_modulo}