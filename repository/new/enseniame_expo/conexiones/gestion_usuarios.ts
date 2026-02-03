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
      console.error('Error en entrar:', error.message);
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
                user.id,alumno.racha,alumno.racha_maxima,alumno.xp,alumno.coins,alumno.nivel,user.avatar);
      }
     
    }
}

const ingresar = async  (mail:string, contraseña: string) =>{
  try {
    //sign in auth
    const {data:auth,error:auth_error} = await supabase.auth.signInWithPassword({
      "email": mail,
      "password": contraseña
    });
    if (auth_error)  {
      if (auth_error.code=='invalid_credentials') {
        error_alert("Usuario o contraseña incorrectos");
        return
      }
      else throw auth_error
    }
    
    if (auth.user){
      const { data: user, error } = await supabase.from('Users').select('*').eq('mail', mail).single();
      if (error) throw error

      if (user ) {
                
      //devolver usuario hallado      
        if (user.is_prof){
          const { data: profe, error } = await supabase.from('Profesores').select('*').eq('id', user.id).single();
          console.log(profe)
          if (error) throw error
          return new Logged_Profesor(user.mail,user.username,user.hashed_password,profe.institucion,user.id,profe.is_admin,user.avatar) ;
        } else {
          const { data: alumno, error } = await supabase.from('Alumnos').select('*').eq('id', user.id).single();
          console.log(alumno)
          if (error) throw error
          return  new Logged_Alumno(user.mail,user.username,user.hashed_password,
                  user.id,alumno.racha,alumno.racha_maxima,alumno.xp,alumno.coins,alumno.last_login,user.avatar);
        }
      } 
    }
   
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
  }
}

const registrar_profe = async (user:Profesor )=>{
  let unsecured_pass= user.hashed_password;
  user.hashed_password= await hash(user.hashed_password);
  if (await cuenta_existe(user.mail)) {
    error_alert("Ya existe un usuario con ese mail.");
    return;
  }
  try {
    const { data:auth_user, error: auth_error } = await supabase.auth.signUp({
      email: user.mail,
      password: unsecured_pass,   
      options: {
          data: {
            first_name: user.username,            
          },
        },    
      });
    if (auth_error) {
      console.error('Error autenticando:', auth_error);
      return;
    }    

    if (auth_user){
      const {data, error } = await supabase
        .from('Users')
        .insert({mail:user.mail,username:user.username,is_prof:user.is_prof,
          hashed_password:user.hashed_password,auth_id:auth_user.user?.id})
        .select("*")
        .single()
        ;

    if (error) {
      console.error('Error al registrar profe:', error.message);
      return;
    }
    if (data ) {      
      //insertar profe
      const { data: profe, error } = await supabase.from('Profesores')
                                      .insert([{id:data.id,institucion:user.institution,is_admin:false}])
                                      .select().single();
      if (error) throw error
      return new Logged_Profesor(data.mail,data.username,data.hashed_password,profe.institution,data.id,profe.is_admin,data.avatar) ;
    }
    }

    

  } catch (error: any) {
    console.error('Error insertando:', error.message);
    error_alert("Error al crear usuario")
  }
}
const registrar_alumno = async (user:User)=>{
  let unsecured_pass= user.hashed_password;
  user.hashed_password= await hash(user.hashed_password);
  if (await cuenta_existe(user.mail)) {
    error_alert("Ya existe un usuario con ese mail.");
    return;
  }
  try {
    const { data:auth_user, error: auth_error } = await supabase.auth.signUp({
      email: user.mail,
      password: unsecured_pass,    
      options: {
          data: {
            first_name: user.username,            
          },
        },  
      });
    if (auth_error) {
      console.error('Error de autenticación:', auth_error);
      return;
    }  

    if (auth_user){
      const {data, error } = await supabase
        .from('Users')
        .insert({mail:user.mail,username:user.username,is_prof:user.is_prof,
          hashed_password:user.hashed_password,auth_id:auth_user.user?.id})
        .select("*")
        .single()
        ;
         if (error) {
      console.error('Error al registrar alumno:', error.message);
      return;
      }
      if (data ) {      
        //insertar alumno
        const { data: alumno, error } = await supabase.from('Alumnos')
                                        .insert([{id:data.id,racha:1,racha_maxima:1,xp:0,coins:0}])
                                        .select().single();
        if (error) throw error
        return new Logged_Alumno(user.mail,user.username,user.hashed_password,
                    alumno.id,alumno.racha,alumno.racha_maxima,alumno.xp,alumno.coins,alumno.last_login,data.avatar);
      }
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
      console.error('Error al verificar la cuenta:', error.message);
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
    const {data:auth,error:auth_error} = await supabase.auth.getUser();
    if (auth_error) throw auth_error
    
    if (auth.user){
      const { data, error } = await supabase.functions.invoke('user-self-deletion', {
        body: { name: 'Functions',auth_id: auth.user.id},
      });
      if (error) throw error
      console.log(data)
    }
    
    
    
    /* const { error } = await supabase
      .from('Users')
      .delete()
      .eq('id', id);
     */
  } catch (error) {
    console.error(error)
  }
}

const nombre_usuario = async (uid:number) => {
  const {data,error} = await supabase.from('Users').select("username").eq('id', uid);
  if (error) throw error
  if (data && data.length>0) return data[0].username
}

const enviar_otp = async (mail:string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: mail,
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: false,
    },
  });
  if (error) throw error
}

const verificar_otp = async (mail:string,codigo:string) => {
  const {data: { session },error} = await supabase.auth.verifyOtp({
    email: mail,
    token: codigo,
    type: 'email',
  });
  if (session) {
    let usuario = await entrar(mail);
    return usuario
  }
}

export {ingresar, registrar_alumno,registrar_profe, cuenta_existe , entrar, eliminar_usuario, nombre_usuario,
  enviar_otp, verificar_otp
}