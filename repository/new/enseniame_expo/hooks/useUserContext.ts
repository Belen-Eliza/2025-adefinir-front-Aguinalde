import { Logged_User,  } from '@/components/types';
import { Session } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

export type UserData={
    user:   Logged_User,
    session?: Session | null
    isLoggedIn: boolean,
    isLoading:boolean,
    cambiarNombre: (nombre_nuevo: string) => void,
    cambiar_mail: (mail_nuevo: string) => void,
    cambiar_password: (password_nuevo: string) => void,
    cambiar_institucion: (i_nueva:string)=> void,
    login_app: (user: Logged_User) => void,
    logout: () => void,
    actualizar_info: (id:number)=>void
}

export  const UserContext = createContext<UserData>({
    
    user: new  Logged_User("","","",0),
    session:undefined,
    isLoggedIn: false,
    isLoading:false,
    cambiarNombre: (nombre_nuevo: string) => { },
    cambiar_mail: (mail_nuevo: string) => { },
    cambiar_password: (password_nuevo: string) => { },
    cambiar_institucion: (i_nueva:string)=> { },
    login_app: (user: Logged_User) => {},
    logout: () => { },
    actualizar_info: (id:number)=>{}
});

export const useUserContext = ()=>useContext(UserContext)
