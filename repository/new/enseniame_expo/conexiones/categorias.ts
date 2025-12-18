import { supabase } from '../utils/supabase'
import { Logged_Alumno, Logged_Profesor, Profesor, User } from '@/components/types'
import { router } from 'expo-router';
import { error_alert } from '@/components/alert';


const crearNuevaCategoria = async (nombre:string) =>{
    
    const { data, error } = await supabase.from('Categorias').insert([
        { nombre: nombre},
    ])
    .select();
    if (error) throw error
    
}

const traerCategorias = async () =>{
    const { data, error } = await supabase
        .from('Categorias')
        .select('id,nombre')
        .order('nombre', { ascending: true });
    if (error) throw error
    return data
}

export {crearNuevaCategoria, traerCategorias}