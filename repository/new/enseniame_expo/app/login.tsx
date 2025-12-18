import { Pressable,  TextInput,  View,
  StyleSheet,  ScrollView,  AppState, 
  TouchableOpacity, KeyboardAvoidingView,  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useState } from "react";
import { Link , router} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { validateEmail, validatePassword } from '@/components/validaciones';
import { error_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import {ingresar} from "../conexiones/gestion_usuarios"
import { useUserContext } from '@/context/UserContext';
import { supabase } from '../lib/supabase'
import { estilos } from '@/components/estilos';
import { paleta, paleta_colores } from '@/components/colores';
import { IconTextInput, PasswordInput } from '@/components/inputs';
import { BotonLogin } from '@/components/botones';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Login() {
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {login_app} = useUserContext();

  const img = require("../assets/images/lsa-aqua.png");

  async function login  (){
    const lower_case_mail = mail.toLowerCase();
    const isEmailValid = validateEmail(lower_case_mail).status;
    const isPasswordValid = validatePassword(password).status;
    if (isPasswordValid && isEmailValid) {
      //acceder a db
      const usuario = await ingresar(lower_case_mail,password);
      if (usuario) login_app(usuario);
      setMail("");
      setPassword("");
      setShowPassword(false);
    } else {
      error_alert("Complete todos los campos para continuar");  
    }
  }
  return (
    <View
      style={styles.mainView}
    >
       <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
      <ScrollView contentContainerStyle={[styles.scrollViewContent]}>
          <View style={styles.formAndImg}>

            <Image
              style={styles.image}
              source={img}
              contentFit="cover"
              transition={1000}
            />
          
           <View style={{alignSelf:"flex-start"}}>
              <ThemedText type='title'>Ingresa a tu cuenta</ThemedText>

              <View style={{marginVertical:15}}>
                <Link href="/signup_alumno" >
                  <ThemedText lightColor='gray'>¿No tienes un usuario? / </ThemedText> {''}
                  <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Regístrate aquí</ThemedText>
                </Link>
              </View>
           </View>

            <View style={styles.formContainer}>
             
              <IconTextInput 
                icon={{Ionicon_name:"mail-outline"}} 
                value={mail} 
                bck_color={paleta.soft_yellow} 
                onChange={setMail} 
                placeholder='Correo electrónico' 
                keyboardType='email-address' />

              <PasswordInput 
                value={password} 
                bck_color={paleta.softgray} 
                onChange={setPassword} 
                showPassword={showPassword} 
                setShowPassword={setShowPassword} 
                placeholder='Contraseña' />

              <View style={{marginVertical:15}}>
                <Link href="/acc_recovery" >
                  <ThemedText lightColor='gray'>¿Olvidaste tu contraseña? / </ThemedText> {''}
                  <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Recuperar</ThemedText>
                </Link>
              </View>

              <BotonLogin callback={login} textColor='black' bckColor='#73d3c8ff' text='Ingresar'  />

            </View>
            
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      <Toast/>
    </View>
  );
}

const styles = StyleSheet.create({
  mainView:{
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    height: '100%',
    backgroundColor: "white"
  },
  
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minWidth: "80%",
    
  },
  formAndImg: {
    width: '100%',
    borderRadius: 10,
    padding: 20,
    justifyContent: "center",
    alignItems: 'center',
    height: "100%"
  },
  formContainer: {
    width: "100%",
    zIndex: 999,
    marginBottom: 20,
    marginTop: 15
  },

  image: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  
})

