import { Alumno, Logged_Alumno, Logged_Profesor, Logged_User, User } from '@/components/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState } from 'react';
import { supabase } from '../utils/supabase'
import { error_alert } from '@/components/alert';
import { cuenta_existe } from '@/conexiones/gestion_usuarios';
import * as Crypto from 'expo-crypto';

const hash = async (text: string) =>{
  const h = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, text
      );
  
  return h;
}

export  const UserContext = createContext({
    
    user: new  Logged_User("","","",0),
    isLoggedIn: false,
    cambiarNombre: (nombre_nuevo: string) => { },
    cambiar_mail: (mail_nuevo: string) => { },
    cambiar_password: (password_nuevo: string) => { },
    cambiar_institucion: (i_nueva:string)=> { },
    login_app: (user: Logged_User) => {},
    logout: () => { },
    actualizar_info: (id:number)=>{}
});

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user,setUser] = useState<Logged_User>(new Logged_Alumno("","","",0,0,0,0,0,new Date(),0));
    
    const [isLoggedIn, setIsLoggedIn] = useState(false); 

    const cambiarNombre = async (nombre_nuevo: string) => {
        //conectar a db, update
        try {
            const { data, error } = await supabase
                .from('Users')
                .update({ username: nombre_nuevo })
                .eq('id', user.id)
                .select();

            if (error) error_alert("Error al actualizar perfil");
            if (data && data.length>0) console.log(data)
        } catch (error) {
            console.error(error);
        }
    }

    const cambiar_mail = async (mail_nuevo: string) => {
        //conectar a db, update
        try {
            const { data, error } = await supabase
                .from('Users')
                .update({ mail: mail_nuevo })
                .eq('id', user.id)
                .select("*");

            if (error) error_alert("Error al actualizar perfil");
            //lidiar con error de repeticion de mails

            if (data && data.length>0) console.log(data);
            
        } catch (error) {
            console.error(error);
        }
    }


    const cambiar_password = async (password_nuevo: string) => {
        //conectar a db, update
        const hashed_password = await hash(password_nuevo);
        try {
            const { data, error } = await supabase
                .from('Users')
                .update({ hashed_password: hashed_password })
                .eq('id', user.id)
                .select();

            if (error) error_alert("Error al actualizar perfil");
            if (data && data.length>0) console.log(data)
        } catch (error) {
            console.error(error);
        }
    }

    const cambiar_institucion = async (i_nueva: string) => {
        //conectar a db, update
        try {
            const { data, error } = await supabase
                .from('Profesores')
                .update({ institucion: i_nueva })
                .eq('id', user.id)
                .select();

            if (error) error_alert("Error al actualizar perfil");
            if (data && data.length>0) console.log(data)
        } catch (error) {
            console.error(error);
        }
    }

    const login_app = async (user:Logged_User) => {
        setUser(user)
        
        setIsLoggedIn(true);
        user.goHome();
        try {
            await  AsyncStorage.setItem("token",String(user.id));
        } catch (error) {
            console.log(error,"al guardar la sesión");
        }
    }

    const logout = async () => {
        setIsLoggedIn(false);
        setUser(new Logged_Alumno("","","",0,0,0,0,0,new Date(),0))
        try {
            await  AsyncStorage.removeItem("token");
        } catch (error) {
            console.log(error,"al cerrar la sesión");
        }
    }

    const actualizar_info = async (id:number)=> {
        //bajar updates de db
        try{
            const { data: user, error } = await supabase.from('Users').select('*').eq('id', id).single();

            if (error) {
                console.error('Error:', error.message);
                return;
            }
            if (user ) {
                // Normalize and coerce fields from Users to avoid display/type issues
                const raw = user;
                const isProf: boolean = (raw?.is_prof === true) || (raw?.is_prof === 'true') || (raw?.is_prof === 1);
                const mailNorm: string = String(raw?.mail ?? '').trim().toLowerCase();
                const usernameNorm: string = String(raw?.username ?? '').trim() || 'Alumno';
                const passwordHash: string = String(raw?.hashed_password ?? '');
                
                if (isProf) {
                    const { data: profe, error } = await supabase.from('Profesores').select('*').eq('id', id).single();
                    const institution: string  =  String(profe.institucion).trim() ;
                    if (error) throw error
                    setUser(new Logged_Profesor(mailNorm, usernameNorm, passwordHash, institution ?? '', id,profe.is_admin));
                } else {
                    const { data: alumno, error } = await supabase.from('Alumnos').select('*').eq('id', id).single();
                    if (error) throw error
                    setUser(new Logged_Alumno(mailNorm, usernameNorm, passwordHash, id,alumno.racha,
                                            alumno.racha_maxima,alumno.xp,alumno.coins,alumno.last_login,alumno.nivel,raw.avatar));
                }
                console.log(user)
            }
        }
        catch (error){
            console.error(error);
        }
    }

    return (
      <UserContext.Provider value={{user,isLoggedIn , cambiarNombre,cambiar_institucion,
                                  login_app, logout, cambiar_mail,cambiar_password,actualizar_info}}>
          {children}
      </UserContext.Provider>
  );
    
}



export const useUserContext = () => {
    return useContext(UserContext);
}