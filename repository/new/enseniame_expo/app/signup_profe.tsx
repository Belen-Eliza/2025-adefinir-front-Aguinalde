import {   View,  StyleSheet,  Platform,  ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { useEffect, useState } from "react";
import { Link} from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { estilos } from '@/components/estilos';
import { error_alert,success_alert } from '@/components/alert';
import { validateEmail, validatePassword, validateInstitution } from '@/components/validaciones';
import Toast from 'react-native-toast-message';
import { registrar_profe } from '@/conexiones/gestion_usuarios';
import { Profesor } from '@/components/types';
import { useUserContext } from '@/hooks/useUserContext';
import { BotonLogin } from '@/components/botones';
import { IconTextInput, PasswordInput } from '@/components/inputs';
import { paleta } from '@/components/colores';


export default function Signup() {
  
  const [mail, setMail] = useState('');
  const [name, setName] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [institucion, setInstitucion]= useState('');

  const [errorEmail, setErrorEmail] = useState('');
  const [errorName, setErrorName] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorPasswordConfirm, setErrorPasswordConfirm] = useState('');
  const [errorI, setErrorI] = useState('');

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const {login_app} = useUserContext()

  const validatePasswordConfirm = (password1:String, password2:String) => {
      if (password1 !== password2) {
          setErrorPasswordConfirm('Las contraseñas deben coincidir');
          return false;
      } else {
          setErrorPasswordConfirm('');
          return true;
      }
    };

    const handleEmailChange = (text:any) => {
      setMail(text);
      setErrorEmail(validateEmail(text).msj);
    };

    const handleNameChange = (text:any) => {
        setName(text);
        setErrorName(text ? '' : 'El nombre de usuario no puede estar vacío');
    };

    const handlePasswordChange = (text:any) => {
        setPassword1(text);
        setErrorPassword(validatePassword(text).msj);
        validatePasswordConfirm(text, password2);
    };

    const handlePasswordConfirmChange = (text:any) => {
        setPassword2(text);
        validatePasswordConfirm(password1, text);
    };

    const handleInstitutionChange = (text:any) =>{
      setInstitucion(text);
      setErrorI(text ? '' : 'El nombre de la institución no puede estar vacío');
    }


  async function signup() {
    const lower_case_mail =mail.toLowerCase();
    
    const isEmailValid = validateEmail(lower_case_mail).status;
    const isNameValid = name !== '';
    const isPasswordValid = validatePassword(password1).status;
    const isPasswordConfirmValid = password1==password2;
    const isInstitutionValid = validateInstitution(institucion);

    if (isEmailValid && isNameValid && isPasswordValid && isPasswordConfirmValid && isInstitutionValid) {
      const user = new Profesor(lower_case_mail,name,password1,institucion);
      const usuario_log = await registrar_profe(user);
      if (usuario_log) login_app(usuario_log);
           
    }
    else {
      error_alert("Complete todos los campos para continuar");  
    }
  }

  return (
    <View style={[styles.mainView]} >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : "padding"}
        style={{flex: 1}}
      >
      <ScrollView contentContainerStyle={[styles.scrollViewContent,estilos.centrado]}>
       
        <View style={styles.formContainer}>
       
        <View style={{alignSelf:"flex-start"}}>
          <ThemedText type='title'>Crear cuenta como profesor</ThemedText>

          <View style={{marginVertical:15}}>
            <Link href="/login" >
              <ThemedText lightColor='gray'>¿Ya tienes un usuario? / </ThemedText> {''}
              <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Inicia sesión aquí</ThemedText>
            </Link>
          </View>
        </View>
      
      
      <IconTextInput 
        icon={{Ionicon_name: "person-outline"}} 
        value={name} 
        bck_color={paleta.softgray}
        onChange={handleNameChange}
        keyboardType='default'
        placeholder='Nombre' />
      {errorName ? <ThemedText type='error'>{errorName}</ThemedText> : null}

      <IconTextInput 
        icon={{Ionicon_name: "mail-outline"}} 
        value={mail} 
        bck_color={paleta.softgray}
        onChange={handleEmailChange}
        keyboardType='email-address'
        placeholder='Correo electrónico' />
      {errorEmail ? <ThemedText type='error'>{errorEmail}</ThemedText> : null}

      <PasswordInput 
        value={password1}
        bck_color={paleta.soft_yellow}
        onChange={handlePasswordChange}
        showPassword={showPassword1}
        setShowPassword={()=> setShowPassword1(!showPassword1)}
        placeholder='Contraseña'
      />
      {errorPassword ? <ThemedText type='error' style={{maxWidth: "80%"}}>{errorPassword}</ThemedText> : null}

      <PasswordInput 
        value={password2}
        bck_color={paleta.soft_yellow}
        onChange={handlePasswordConfirmChange}
        showPassword={showPassword2}
        setShowPassword={()=> setShowPassword2(!showPassword2)}
        placeholder='Confirmar contraseña'
      />
      {errorPasswordConfirm ? <ThemedText type='error'>{errorPasswordConfirm}</ThemedText> : null}

      <IconTextInput 
        icon={{Ionicon_name: "business-outline"}} 
        value={institucion} 
        bck_color={paleta.softgray}
        onChange={handleInstitutionChange}
        keyboardType='default'
        placeholder='Institución' />
      {errorI ? <ThemedText type='error'>{errorI}</ThemedText> : null}

      <View style={{marginVertical:15}}>
        <Link href="/signup_alumno" >
          <ThemedText lightColor='gray'>¿Eres alumno? / </ThemedText> {''}
          <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Crear cuenta de alumno</ThemedText>
        </Link>
      </View>

      <BotonLogin callback={signup} textColor={'black'} bckColor={paleta.dark_aqua} text={'Registrarse'} />
      
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
      <Toast/>
    </View>
  );
}

const styles=StyleSheet.create({
  mainView:{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
    backgroundColor: "white"
  },
  
  scrollViewContent: {
    //flexGrow: 1,
    height:"110%",
    justifyContent: 'space-between',
    minWidth: "80%",
  },
  formContainer: {
    width: '100%',
    borderRadius: 10,
    padding: 20,
    justifyContent: "center",
    alignItems: 'center',
    height: "100%"
  },
  loginButton: {
      backgroundColor: '#F72585',
      borderRadius: 10,
      height: 50,
      minWidth: "60%",
      justifyContent: 'center',
      alignItems: 'center',
      margin: 30,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,
  },
  textInput:{
        padding:8,
        backgroundColor: "white",
        fontSize:18,
        
        minWidth: "60%",
        maxHeight: 60,
        minHeight: 40,
        borderColor: "#0538cf",
        borderRadius: 5,
        borderWidth: 2,
        flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15
    },
    inputIcon: {
      marginRight: 10,
    },
     title : {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 50,
    textAlign: 'center',
  },
  checkbox: {
    margin: 8,
  },
})
