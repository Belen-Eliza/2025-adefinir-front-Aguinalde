import { supabase } from '../lib/supabase'
import { Logged_Alumno, Logged_Profesor, User } from '@/components/types'
import { error_alert } from '@/components/alert';
import * as Crypto from 'expo-crypto';
import { sumar_racha } from './racha';

const hash = async (text: string) =>{
  const h = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, text
      );
  
  return h;
}

const entrar = async (mail: string)=>{
  const { data: user, error } = await supabase.from('Users').select('*').eq('mail', mail);

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (user && user.length > 0) {
      
        //inicializar entorno
        const usuario = user[0].is_prof ? new Logged_Profesor(user[0].mail,user[0].username,user[0].hashed_password,user[0].institution,user[0].id) :
                                         new Logged_Alumno(user[0].mail,user[0].username,user[0].hashed_password,user[0].id);
        
       return usuario      
    }
}

const ingresar = async  (mail:string, contraseña: string) =>{
  try {
    const { data: user, error } = await supabase.from('Users').select('*').eq('mail', mail);

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    if (user && user.length > 0) {
      const password_hash = await hash(contraseña);
      if (password_hash!= user[0].hashed_password || mail!= user[0].mail) {
        error_alert("Usuario o contraseña incorrectos");
        console.error("Las contraseñas sin hash ya no son válidas");
      } else{
        //devolver usuario hallado
       
       const usuario = user[0].is_prof ? new Logged_Profesor(user[0].mail,user[0].username,user[0].hashed_password,user[0].institution,user[0].id) :
                                         new Logged_Alumno(user[0].mail,user[0].username,user[0].hashed_password,user[0].id);
                
       return usuario
        
      }
    } else{
      error_alert("Usuario o contraseña incorrectos");
    }
    
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
  }
}

const registrarse = async (user:User )=>{
  user.hashed_password= await hash(user.hashed_password);
  if (await cuenta_existe(user.mail)) {
    error_alert("Ya existe un usuario con ese mail.");
    return;
  }
  try {
    const {data, error } = await supabase
          .from('Users')
          .insert(user)
          .select("*")
          ;

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (data && data.length!=0) {
        const usuario = data[0].is_prof ? new Logged_Profesor(data[0].mail,data[0].username,data[0].hashed_password,data[0].institution,data[0].id) :
                                         new Logged_Alumno(data[0].mail,data[0].username,data[0].hashed_password,data[0].id);
                
       return usuario
    }

  } catch (error: any) {
    console.error('Error insertando:', error.message);
    error_alert("Error al crear usuario")
  }
}

const cuenta_existe = async (mail:string)=>{
  try {
    const { data: user, error } = await supabase.from('Users').select('*').eq('mail', mail);

    if (error) {
      console.error('Error:', error.message);
      return false;
    }

    if (user && user.length >0) {
      return true 
    }
    return false
  } catch (error:any) {
    console.error('Error insertando:', error.message);
    error_alert("Error al recuperar usuario")
  }
}

const eliminar_usuario = async (id:number)=>{
  try {
    
    const { error } = await supabase
      .from('Users')
      .delete()
      .eq('id', id);
          
  } catch (error) {
    console.error(error)
  }
}

const nombre_usuario = async (uid:number) => {
  const {data,error} = await supabase.from('Users').select("username").eq('id', uid);
  if (error) throw error
  if (data && data.length>0) return data[0].username
}

export {ingresar, registrarse, cuenta_existe , entrar, eliminar_usuario, nombre_usuario}