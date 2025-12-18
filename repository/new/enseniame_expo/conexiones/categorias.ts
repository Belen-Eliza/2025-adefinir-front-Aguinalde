import { supabase } from '../lib/supabase'

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