import { Avatar } from '@/components/types';
import { supabase } from '../lib/supabase'

const my_avatar = async (id:number) => {
    let { data: Avatar, error } = await supabase
        .from('Users')
        .select('*, Avatar(*)')
        .eq("id",id)
        .single()
    if (error) throw error;
    return Avatar
}

const todos_avatares = async () => {
    let { data: Avatar, error } = await supabase
        .from('Avatar')
        .select('*')                
    if (error) throw error;
    return Avatar
}

const cambiar_mi_avatar = async (user_id:number,avatar_id:number) => {
    let { error} = await supabase.from("Users")
        .update({"avatar":avatar_id})
        .eq("id",user_id)
        .select()
    if (error) throw error;    
}

const desbloquee_un_avatar = async (racha_nueva:number, racha_max:number) => {
    let res = false;
    if (racha_max<racha_nueva) {
        const a: Avatar[] | null = await todos_avatares();
        a?.forEach(each=>{
            if (each.racha_desbloquear==racha_nueva) res = true;
        })
    }       
    return res
}

const nuevo_avatar_desbloqueado = async (racha_nueva:number) => {
    let { data: Avatar, error } = await supabase
        .from('Avatar')
        .select('*')
        .eq("racha_desbloquear",racha_nueva)
        .single()
    if (error) throw error;
    return Avatar
}

export { my_avatar, todos_avatares, cambiar_mi_avatar,desbloquee_un_avatar,nuevo_avatar_desbloqueado}