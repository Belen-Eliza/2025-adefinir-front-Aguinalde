import { AppState } from 'react-native'
import { supabase } from '../utils/supabase'
import { Logged_Alumno, Logged_Profesor, Profesor, User } from '@/components/types'
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
  const { data: user, error } = await supabase.from('Users').select('*').eq('mail', mail).single();

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (user ) {
      
      //inicializar entorno
      if (user.is_prof){
        const { data: profe, error } = await supabase.from('Profesores').select('*').eq('id', user.id).single();
        if (error) throw error
        return new Logged_Profesor(user.mail,user.username,user.hashed_password,user.institution,user.id,profe.is_admin,user.avatar) ;
      } else {
        const { data: alumno, error } = await supabase.from('Alumnos').select('*').eq('id', user.id).single();
        if (error) throw error
        return  new Logged_Alumno(user.mail,user.username,user.hashed_password,
                user.id,alumno.racha,alumno.racha_maxima,alumno.xp,alumno.coins,user.avatar);
      }
     
    }
}

const ingresar = async  (mail:string, contraseña: string) =>{
  try {
    const { data: user, error } = await supabase.from('Users').select('*').eq('mail', mail).single();

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    if (user ) {
      const password_hash = await hash(contraseña);
      if (password_hash!= user[0].hashed_password || mail!= user[0].mail) {
        error_alert("Usuario o contraseña incorrectos");
        
      } else{
        //devolver usuario hallado      
        if (user.is_prof){
          const { data: profe, error } = await supabase.from('Profesores').select('*').eq('id', user.id).single();
          if (error) throw error
          return new Logged_Profesor(user.mail,user.username,user.hashed_password,user.institution,user.id,profe.is_admin,user.avatar) ;
        } else {
          const { data: alumno, error } = await supabase.from('Alumnos').select('*').eq('id', user.id).single();
          if (error) throw error
          return  new Logged_Alumno(user.mail,user.username,user.hashed_password,
                  user.id,alumno.racha,alumno.racha_maxima,alumno.xp,alumno.coins,user.avatar);
        }
      }
    } else{
      error_alert("Usuario o contraseña incorrectos");
    }
    
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
  }
}

const registrar_profe = async (user:Profesor )=>{
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
        .single()
        ;

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (data ) {      
      //insertar profe
      const { data: profe, error } = await supabase.from('Alumnos')
                                      .insert([{id:data.id,institucion:user.institution,is_admin:false}])
                                      .select().single();
      if (error) throw error
      return new Logged_Profesor(data.mail,data.username,data.hashed_password,profe.institution,data.id,profe.is_admin,data.avatar) ;
    }

  } catch (error: any) {
    console.error('Error insertando:', error.message);
    error_alert("Error al crear usuario")
  }
}
const registrar_alumno = async (user:User)=>{
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
        .single()
        ;

    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (data ) {      
      //insertar alumno
      const { data: alumno, error } = await supabase.from('Alumnos')
                                      .insert([{id:data.id,racha:1,racha_maxima:1,xp:0,coins:0}])
                                      .select().single();
      if (error) throw error
      return new Logged_Alumno(user.mail,user.username,user.hashed_password,
                  alumno.id,alumno.racha,alumno.racha_maxima,alumno.xp,alumno.coins,data.avatar);
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

export {ingresar, registrar_alumno,registrar_profe, cuenta_existe , entrar, eliminar_usuario, nombre_usuario}