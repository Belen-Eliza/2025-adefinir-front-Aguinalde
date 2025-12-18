import { supabase } from '../lib/supabase'
import { cantidad_aprendidas } from './aprendidas';
import { modulos_completados_por_alumno } from './modulos';
import { mis_objetivos_completados } from './objetivos';
import { mi_racha } from './racha';

const todas_insignias = async () => {
    
    let { data: Insignias, error } = await supabase
        .from('Insignias')
        .select('*');
    if (error) throw error
    return Insignias
}

const insignias_modulos = async () => {
    let { data: Insignias, error } = await supabase
        .from('Insignias')
        .select('*')
        .eq("motivo",2);
    if (error) throw error
    return Insignias
}

const insignias_racha = async () => {
    let { data: Insignias, error } = await supabase
        .from('Insignias')
        .select('*')
        .eq("motivo",1);
    if (error) throw error
    return Insignias
}

const insignias_objetivos = async () => {
    let { data: Insignias, error } = await supabase
        .from('Insignias')
        .select('*')
        .eq("motivo",4);
    if (error) throw error
    return Insignias
}

const insignias_senias = async () => {
    let { data: Insignias, error } = await supabase
        .from('Insignias')
        .select('*')
        .eq("motivo",3);
    if (error) throw error
    return Insignias
}

const categorias_insignias = async () => {
    
    let { data: Motivos_Insignia, error } = await supabase
    .from('Motivos_Insignia')
    .select('*')
    if (error) throw error
    return Motivos_Insignia          
}

const insignias_por_categoria = async  (id_cate:number) => {
    let { data: Insignias, error } = await supabase
        .from('Insignias')
        .select('*')
        .eq("motivo",id_cate);
    if (error) throw error
    return Insignias
}

const buscar_categoria = async (id_cate:number) => {
    let { data: Motivos_Insignia, error } = await supabase
        .from('Motivos_Insignia')
        .select('*')
        .eq("id",id_cate)
        .single()
    if (error) throw error
    return Motivos_Insignia 
}

const mis_insignias_ganadas = async (id_alumno:number) => {
    let {data: mis_i, error: e2} = await supabase
        .from('Alumno_Insignia')
        .select('*')
        .eq("id_alumno",id_alumno);
    if (e2) throw e2;
    return mis_i
}

const mis_insignias = async (id_alumno:number) => {
    let {data: mis_i, error: e2} = await supabase
        .from('Alumno_Insignia')
        .select('*, Insignias(*)')
        .eq("id_alumno",id_alumno);
    if (e2) throw e2;
    return mis_i?.map(e=>e.Insignias)
}

const ganar_insignia_senia = async (id_alumno:number) => {
    // buscar insignias de categoria señas que no hayas ganado aún
    
    const i = await insignias_por_categoria(3);
    const mis_i= await mis_insignias_ganadas(id_alumno)

    if (i && mis_i){
        let no_ganadas: any[] =[];
        i.forEach(each=>{
            if (!mis_i.find(ganada=>ganada.id_insignia==each.id)) {
                no_ganadas.push(each);
            }
        })

        // verificar si acabas de ganar alguna
        const cantidad_senias_aprendidas = await cantidad_aprendidas(id_alumno);
        no_ganadas.forEach(async each=>{
            if (each.cantidad<= cantidad_senias_aprendidas) {
                //marcar como ganada                
                const { data, error } = await supabase
                    .from('Alumno_Insignia')
                    .insert( [{ id_alumno: id_alumno, id_insignia: each.id }]);                    
                if (error) throw error;                
            }
        })
    }                  
}

const ganar_insignia_modulo = async (id_alumno:number) => {
    // buscar insignias de categoria modulo que no hayas ganado aún
    
    const i = await insignias_por_categoria(2);
    const mis_i= await mis_insignias_ganadas(id_alumno)

    if (i && mis_i){
        let no_ganadas: any[] =[];
        i.forEach(each=>{
            if (!mis_i.find(ganada=>ganada.id_insignia==each.id)) {
                no_ganadas.push(each);
            }
        })

        // verificar si acabas de ganar alguna
        const cant_modulos_completos = await modulos_completados_por_alumno(id_alumno);
        no_ganadas.forEach(async each=>{
            if (each.cantidad<= cant_modulos_completos) {
                //marcar como ganada                
                const {  error } = await supabase
                    .from('Alumno_Insignia')
                    .insert( [{ id_alumno: id_alumno, id_insignia: each.id }]);                    
                if (error) throw error;   
                           
            }
        })
    }                  
}
const ganar_insignia_racha = async (id_alumno:number) => {
    // buscar insignias de categoria racha que no hayas ganado aún
    
    const i = await insignias_por_categoria(1);
    const mis_i= await mis_insignias_ganadas(id_alumno)

    if (i && mis_i){
        let no_ganadas: any[] =[];
        i.forEach(each=>{
            if (!mis_i.find(ganada=>ganada.id_insignia==each.id)) {
                no_ganadas.push(each);
            }
        })

        // verificar si acabas de ganar alguna
        const racha = await mi_racha(id_alumno);
        no_ganadas.forEach(async each=>{
            if (each.cantidad<= racha.racha) {
                //marcar como ganada                
                const {  error } = await supabase
                    .from('Alumno_Insignia')
                    .insert( [{ id_alumno: id_alumno, id_insignia: each.id }]);                    
                if (error) throw error;   
                           
            }
        })
    }                  
}

const ganar_insignia_objetivos = async (id_alumno:number) => {
    // buscar insignias de categoria racha que no hayas ganado aún
    
    const i = await insignias_por_categoria(4);
    const mis_i= await mis_insignias_ganadas(id_alumno)

    if (i && mis_i){
        let no_ganadas: any[] =[];
        i.forEach(each=>{
            if (!mis_i.find(ganada=>ganada.id_insignia==each.id)) {
                no_ganadas.push(each);
            }
        })

        // verificar si acabas de ganar alguna
        const objetivos_completos = await mis_objetivos_completados(id_alumno) || [];
        no_ganadas.forEach(async each=>{
            if (each.cantidad<= objetivos_completos.length) {
                //marcar como ganada                
                const {  error } = await supabase
                    .from('Alumno_Insignia')
                    .insert( [{ id_alumno: id_alumno, id_insignia: each.id }]);                    
                if (error) throw error;   
                           
            }
        })
    }                  
}

const cuantos_ganaron_insignia = async (id_insignia:number) => {
    
    let { data: Alumno_Insignia, error } = await supabase
        .from('Alumno_Insignia')
        .select('*')
        .eq("id_insignia",id_insignia);
    if (error) throw error;      
    if (Alumno_Insignia) return Alumno_Insignia.length
    return 0
}

export {todas_insignias,categorias_insignias,ganar_insignia_senia, mis_insignias_ganadas, ganar_insignia_modulo, ganar_insignia_racha,
    insignias_por_categoria,buscar_categoria, ganar_insignia_objetivos, mis_insignias, cuantos_ganaron_insignia }