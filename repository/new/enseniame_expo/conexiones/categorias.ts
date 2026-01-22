import { supabase } from '../utils/supabase'

const crearNuevaCategoria = async (nombre:string) =>{
    
    const { error } = await supabase.from('Categorias').insert([
        { nombre: nombre},
    ])    
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