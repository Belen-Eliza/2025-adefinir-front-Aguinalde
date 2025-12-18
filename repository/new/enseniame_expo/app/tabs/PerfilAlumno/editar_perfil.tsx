import React, {  useState } from 'react';
import { View, StyleSheet,  ScrollView, TouchableOpacity,  Alert, Pressable, Text } from 'react-native';
import {  Ionicons, MaterialIcons  } from '@expo/vector-icons';
import {  router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { validateEmail, validatePassword } from '@/components/validaciones';
import { eliminar_usuario } from '@/conexiones/gestion_usuarios';
import { paleta, paleta_colores } from '@/components/colores';
import { IconTextInput, PasswordInput } from '@/components/inputs';
import { estilos } from '@/components/estilos';
import { BotonLogin } from '@/components/botones';
import { SmallPopupModal } from '@/components/modals';

export default function Perfil (){
    const [name,setName]= useState<string>();
    const [mail,setMail]= useState<string>();
    const [pass,setPass]=useState<string>();

    const [mailModalVisible, setMailModalVisible] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [PassModalVisible, setPassModalVisible] = useState(false);    

    const [errorEmail, setErrorEmail] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorName,setErrorName] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    
    const contexto = useUserContext();    

    const eliminar_cuenta = ()=>{
      Alert.alert('Eliminar cuenta', '¿Estás seguro de que querés eliminar la cuenta?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {text: 'Confirmar', onPress: () => {
        eliminar_usuario(contexto.user.id);
        salir();
        }}, 
    ])      
    }

    const handleEmailChange = (text:any) => {
      setMail(text);
      setErrorEmail(validateEmail(text).msj); 
    };

    const handleNameChange = (text:any) => {
        setName(text);
        setErrorName(text ? '' : 'El nombre de usuario no puede estar vacío'); 
    };

    const handlePasswordChange = (text:any) => {
        setPass(text);
        setErrorPassword(validatePassword(text).msj); 
        
    };   

    const salir = ()=>{
      contexto.logout();
      router.dismissTo("/");      
    }

    const borrar_cambios = ()=>{
        setName(undefined);
        setMail(undefined);
        setPass(undefined);        
        setErrorEmail("");
        setErrorPassword("");
        setErrorName("");        
    }

    const confirmar = async () => {
        let exito=false;
        if (name!=undefined ) {
            if (name !== '')  {
            contexto.cambiarNombre(name); 
            exito=true;
            }
            else  error_alert("El nombre no puede estar vacío");
        } 
        if (mail!= undefined) {
            const lower_case_mail=mail.toLowerCase();
            if (validateEmail(lower_case_mail).status) {
                contexto.cambiar_mail(lower_case_mail);
                exito=true;
            } else error_alert("Formato inválido de mail");              
        }
        if (pass!=undefined){
            if (validatePassword(pass).status) {
                contexto.cambiar_password(pass);
                exito=true;
            } else error_alert("Contraseña inválida");
        }      
        
        setTimeout( ()=> contexto.actualizar_info(contexto.user.id),400);
        if (exito) {
            setNameModalVisible(false);
            setMailModalVisible(false);
            setPassModalVisible(false);                        
            setTimeout(()=>success_alert("Cambios aplicados"),200)
            borrar_cambios();            
        }        
    }


    return(
        <View style={[styles.mainView,{backgroundColor:"#ebfbfbff"}]}>
            <Pressable
                style={[styles.backBtn, { marginBottom: 10, marginTop:30, flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => {   contexto.user.gotToProfile()   }}
            >
            <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
            <Text style={styles.backBtnText}>Volver</Text>
            </Pressable>
          <ScrollView contentContainerStyle={[styles.scrollViewContent]}>
            <View style={styles.formAndImg}>
              
              <ThemedText style={styles.title} type='title'>Editar perfil</ThemedText>
                
                <View style={styles.formContainer}>
                 <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", margin:15}}>Actualizar datos</ThemedText>
                    <TouchableOpacity onPress={()=>{setNameModalVisible(true)}} style={[styles.infoContainer,estilos.shadow,{borderTopRightRadius:15, borderTopLeftRadius:15,}]}>
                      <ThemedText >Nombre</ThemedText>
                      <View style={{flexDirection:"row"}}>
                        <ThemedText lightColor='gray'>{contexto.user.username}</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>{setMailModalVisible(true)}} style={[styles.infoContainer]}>
                      <ThemedText >Mail</ThemedText>
                      <View style={{flexDirection:"row"}}>
                        <ThemedText lightColor='gray'>{contexto.user.mail}</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                      </View>
                    </TouchableOpacity>

                    

                    <TouchableOpacity onPress={()=>{setPassModalVisible(true)}} style={[styles.infoContainer,{borderBottomRightRadius:15, borderBottomLeftRadius:15,borderBottomWidth:0}]}>
                      <ThemedText >Cambiar contraseña</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                    </TouchableOpacity>                


                    <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", margin:15}}>Cuenta</ThemedText>
                    <TouchableOpacity onPress={eliminar_cuenta} style={[styles.infoContainer,estilos.shadow,{borderBottomRightRadius:15, borderBottomLeftRadius:15,borderBottomWidth:0,borderTopRightRadius:15, borderTopLeftRadius:15}]}>
                      <ThemedText >Eliminar cuenta</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.iconButton,estilos.shadow,{marginTop:90}]} onPress={salir}   >  
                      <ThemedText type="subtitle" lightColor='red'>Salir</ThemedText>
                    </TouchableOpacity>
                </View>            
              </View>
            </ScrollView>

           
            <SmallPopupModal title='Editar nombre' modalVisible={nameModalVisible} setVisible={setNameModalVisible}>
              <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", marginTop:25,marginHorizontal:15}}>Nombre </ThemedText>
                <IconTextInput 
                    icon={{Ionicon_name: "person-outline"}} 
                    value={name} 
                    bck_color="white"
                    onChange={handleNameChange}
                    keyboardType='default'
                    placeholder={contexto.user.username} />
                    
                  {errorName ? <ThemedText type='error'>{errorName}</ThemedText> : null} 
                  <BotonLogin callback={confirmar} textColor='black' text='Guardar cambios' bckColor={paleta.strong_yellow}/>
            </SmallPopupModal>

            <SmallPopupModal title='Editar mail' modalVisible={mailModalVisible} setVisible={setMailModalVisible}>
               <IconTextInput 
                  icon={{Ionicon_name: "mail-outline"}} 
                  value={mail} 
                  bck_color="white"
                  onChange={handleEmailChange}
                  keyboardType='email-address'
                  placeholder={contexto.user.mail}
                />
                {errorEmail ? <ThemedText type='error'>{errorEmail}</ThemedText> : null}

              <BotonLogin callback={confirmar} textColor='black' text='Guardar cambios' bckColor={paleta.strong_yellow}/>
            </SmallPopupModal>            

            <SmallPopupModal title='Cambiar contraseña' modalVisible={PassModalVisible} setVisible={setPassModalVisible}>
              <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", marginTop:25,marginHorizontal:15}}>Nueva contraseña </ThemedText>
              <PasswordInput 
                value={pass}
                bck_color={paleta.soft_yellow}
                onChange={handlePasswordChange}
                showPassword={showPassword}
                setShowPassword={()=> setShowPassword(!showPassword)}
                placeholder='Nueva contraseña'
              />
              {errorPassword ? <ThemedText type='error' style={{maxWidth: "80%"}}>{errorPassword}</ThemedText> : null}

              <BotonLogin callback={confirmar} textColor='black' text='Guardar cambios' bckColor={paleta.strong_yellow}/>
            </SmallPopupModal>    

          <Toast/>
        </View>
    )
}


const styles = StyleSheet.create({
  mainView:{
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    height: '100%',
    marginBottom: 60,
    paddingTop:30 ,
    
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minWidth: "80%",
    paddingBottom:60 
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
    marginTop: 15,
    flex: 1
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor:"white",
    justifyContent: "space-between",
    width:"100%",
    height: 50,
    alignContent:"center",
    alignItems:"center",
    borderBottomColor:"lightgray",
    borderBottomWidth:1,
    padding: 10
  },
  iconButton: {
    borderRadius: 10,
    height: 50,
    minWidth: "100%",
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    width:"100%",
    backgroundColor: "white"
  },
  title : {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  
  backBtn: {
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  backBtnText: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
