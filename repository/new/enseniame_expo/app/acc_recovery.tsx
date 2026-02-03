import { Pressable,  Text,  TextInput,  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableOpacity
} from 'react-native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from "react";
import { Link, router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { validateEmail } from '@/components/validaciones';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { cuenta_existe, entrar, ingresar } from '@/conexiones/gestion_usuarios';
import { enviar_mail_recuperacion, generar_otp } from '@/components/mails';
import { useUserContext } from '@/hooks/useUserContext';
import { BotonLogin } from '@/components/botones';
import { IconTextInput, PasswordInput } from '@/components/inputs';
import { paleta } from '@/components/colores';

export default function Acc_recovery() {
  const [mail, setMail] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputCode,setInputCode]= useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codigo,setCodigo] = useState("1234");
  const contexto=useUserContext();

  const img = require("../assets/images/lsa-aqua.png");

  const handleEmailChange = (text:any) => {
      setMail(text);
      setErrorEmail(validateEmail(text).msj);
  };

  useFocusEffect(
      useCallback(() => {
        const nuevo_codigo= generar_otp();
        setCodigo(nuevo_codigo);
        return () => {
        };
      }, [])
    );
  

  async function enviar_codigo() {
     //verificar que la cuenta exista en la db
    
    const lower_case_mail =mail.toLowerCase();
    if (validateEmail(lower_case_mail).status && await cuenta_existe(lower_case_mail)){
      enviar_mail_recuperacion(lower_case_mail,codigo);
      setModalVisible(true);
    } else{
      error_alert("Ingrese un mail válido");
    }
  }

  async function recuperar() {
    
    const lower_case_mail =mail.toLowerCase();
    if (inputCode===codigo){
      success_alert("Código correcto");
      const usuario=await entrar(lower_case_mail);
      
      if (usuario) {        
        contexto.login_app(usuario);}
      
    } else {
      error_alert("Contraseña incorrecta");
    }
  }
  return (
    <View  style={styles.mainView}  >
      
      <ScrollView contentContainerStyle={[styles.scrollViewContent, ]}>
        
        <View style={styles.formContainer}>
          <View >
            <View style={{alignSelf:"flex-start"}}>
            <ThemedText type='title'>Recuperar cuenta</ThemedText>

            <View style={{marginVertical:15}}>
              <Link href="/login" >
                <ThemedText lightColor='gray'>¿Ya tienes un usuario? / </ThemedText> {''}
                <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Inicia sesión aquí</ThemedText>
              </Link>
            </View>
          </View>

          <IconTextInput 
            icon={{Ionicon_name: "mail-outline"}} 
            value={mail} 
            bck_color={paleta.softgray}
            onChange={handleEmailChange}
            keyboardType='email-address'
            placeholder='Correo electrónico' />
          {errorEmail ? <ThemedText type='error'>{errorEmail}</ThemedText> : null}

          <BotonLogin 
            callback={enviar_codigo}
            textColor='black'
            bckColor={paleta.dark_aqua}
            text='Enviar código'
          />

          </View>
        </View>
      </ScrollView>
      

      <Modal animationType="slide" 
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}>
            <View style={[styles.mainView,{backgroundColor:'rgba(255, 255, 255, 0)'}]}>
              <ScrollView contentContainerStyle={[styles.scrollViewContent, {minWidth:"85%"} ]}>
        
              <View style={[styles.formContainer,{backgroundColor:"white",height:"80%",marginTop:100}]}>

                <View style={{alignSelf:"flex-start"}}>
                  <ThemedText type='title' style={{marginBottom:12}}>Ingresar código</ThemedText>
                  <ThemedText > Se envió un correo a su casilla </ThemedText>
                  <ThemedText>con una contraseña temporal.</ThemedText>
                  <ThemedText>Recuerde restaurarla luego de ingresar.</ThemedText>

                  <View style={{marginVertical:15}}>
                    <TouchableOpacity onPress={()=>{setModalVisible(!modalVisible);router.back();}}>
                      <ThemedText>
                      <ThemedText lightColor='gray'>¿Recordaste tu contraseña? / </ThemedText> {''}
                      <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Cancelar</ThemedText>
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                              

               <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  onChangeText={setInputCode}
                  value={inputCode}
                  placeholder="Código"
                  placeholderTextColor="#999"
                  />
                  <Pressable onPress={()=> setShowPassword(!showPassword)} >
                    <Ionicons style={{position: "relative", left: -20}}
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={24}
                      color="#666"
                    />
                  </Pressable>
              </View>
              {errorEmail ? <ThemedText type='error'>{errorEmail}</ThemedText> : null}

              <View style={{marginVertical:15}}>
                <TouchableOpacity onPress={enviar_codigo} >
                  <ThemedText>
                    <ThemedText lightColor='gray'>¿No lo recibiste? / </ThemedText> {''}
                    <ThemedText style={{fontSize: 16}} type='defaultSemiBold' >Reenviar</ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <BotonLogin 
                callback={recuperar}
                textColor='black'
                bckColor={paleta.dark_aqua}
                text='Recuperar'
              />

              </View>
              </ScrollView>
              <Toast/>
            </View>
           
          <Toast/>
      </Modal>
      <Toast/>
    </View>
    
  );
}

const styles = StyleSheet.create({
  mainView:{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
    backgroundColor: "white"
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
    width: '100%',
    borderRadius: 10,
    padding: 20,
    justifyContent: "center",
    alignItems: 'center',
    height: "100%"
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minWidth: "80%",
  },
 
  textInput:{
    padding:8,
    fontSize:18,
    elevation: 1,
    minWidth: "80%",
    maxHeight: 40,
    minHeight: 40,
    borderRadius: 9,
    flex: 1,
    width: "80%"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    flex: 1,
    borderColor: "lightgray",
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    maxHeight: 42,
    minHeight: 40,
    width: "100%"
  },
  inputIcon: {
    marginRight: 10,
    marginLeft: 10
  },
  image: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
})
