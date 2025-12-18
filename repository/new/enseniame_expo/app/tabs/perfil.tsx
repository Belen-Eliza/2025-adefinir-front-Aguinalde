import React, { useCallback, useState } from 'react';
import { View, StyleSheet,  ScrollView, TouchableOpacity,  Alert, FlatList,  } from 'react-native';
import {  Ionicons, MaterialIcons  } from '@expo/vector-icons';
import {  router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { validateEmail, validatePassword } from '@/components/validaciones';
import { eliminar_usuario } from '@/conexiones/gestion_usuarios';
import { traerReportesProfe } from '@/conexiones/reportes';
import { paleta, paleta_colores } from '@/components/colores';
import { IconTextInput, PasswordInput } from '@/components/inputs';
import { estilos } from '@/components/estilos';
import { Image } from 'expo-image';
import { BotonLogin } from '@/components/botones';
import { SmallPopupModal } from '@/components/modals';
import VideoPlayer from '@/components/VideoPlayer';
import { Avatar } from '@/components/types';
import { cambiar_mi_avatar, my_avatar, todos_avatares } from '@/conexiones/avatars';

export default function Perfil (){
    const [name,setName]= useState<string>();
    const [mail,setMail]= useState<string>();
    const [pass,setPass]=useState<string>();
    const [institucion,setI]=useState<string>();

    const [mailModalVisible, setMailModalVisible] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [PassModalVisible, setPassModalVisible] = useState(false);
    const [instModalVisible, setInstModalVisible] = useState(false);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    
    const [reportesModalVisible, setReportesModalVisible] = useState(false);

    const [errorEmail, setErrorEmail] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [errorName,setErrorName] = useState('');
    const [errorI, setErrorI] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [reportes, setReportes] = useState<any[]>([]);
    const [loadingReportes, setLoadingReportes] = useState(false);

    const contexto = useUserContext();
    
    const [pfp,setPfp]=useState<Avatar>();
    const [avatares,setAvatares] = useState<Avatar[]>([]);  

    useFocusEffect(
      useCallback(() => {
          const fetchData = async () => {
            const reportes = await traerReportesProfe(contexto.user.id);
            setReportes(reportes || []);

            const p = await my_avatar(contexto.user.id);
            const img = require("../../assets/images/pfp.jpg");
            
            if (p.Avatar) {setPfp(p.Avatar)}
            else setPfp({image_url:img,id:1,racha_desbloquear:1});

            const a = await todos_avatares();     
            setAvatares(a || []);
          };
          fetchData();
        return () => {};
      }, [])
    );

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

    const handleInstitutionChange = (text:any) =>{
      setI(text);
      setErrorI(text ? '' : 'El nombre de la institución no puede estar vacío');
      console.log("escribir algo")
    }

    const salir = ()=>{
      contexto.logout();
      router.dismissTo("/")
      
    }

    const borrar_cambios = ()=>{
        setName(undefined);
        setMail(undefined);
        setPass(undefined);
        setI(undefined);
        setErrorEmail("");
        setErrorPassword("");
        setErrorName("");
        setErrorI("")
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
        if (institucion!=undefined){
            if (institucion !== '') {
                contexto.cambiar_institucion(institucion);
                setI(undefined);
            } else error_alert("La institución no puede estar vacía");
        }
        
        setTimeout( ()=> contexto.actualizar_info(contexto.user.id),400);
        if (exito) {
            setNameModalVisible(false);
            setMailModalVisible(false);
            setPassModalVisible(false);            
            setInstModalVisible(false);
            setTimeout(()=>success_alert("Cambios aplicados"),200)
            borrar_cambios();
        }        
    }

    const abrirModalReportes = async () => {
      setLoadingReportes(true);
      try {
        const data = await traerReportesProfe(contexto.user.id);
        setReportes(data || []);
        console.log(data);
      } catch (e) {
        error_alert("No se pudieron cargar los reportes");
      }
      setLoadingReportes(false);
      setReportesModalVisible(true);
    };

    const cambiar_avatar = async (a:Avatar) => {
    try {
      await cambiar_mi_avatar(contexto.user.id,a.id);
      setPfp(a)
      success_alert("¡Tu avatar fue cambiado con éxito!")
    } catch (error) {
      console.error(error);
      error_alert("No se pudo cambiar tu avatar");
    }
  }
    const renderAvatar = ({ item }: { item: Avatar }) =>  (
    <TouchableOpacity 
      onPress={()=>{cambiar_avatar(item)}}
      style={[{margin:10},item.id==pfp?.id ? styles.round_border:{}]}>
      <Image
        style={[styles.image,{borderRadius:50}]}
        source={ item.image_url}
        contentFit="contain"
        transition={0}
      /> 
    </TouchableOpacity>
  )

    return(
        <View style={[styles.mainView,{backgroundColor:"#ebfbfbff"}]}>
          <ScrollView contentContainerStyle={[styles.scrollViewContent]}>
            <View style={styles.formAndImg}>
              <Image
                style={[styles.image,{borderColor:paleta.aqua}]}
                source={pfp?.image_url}
                contentFit="contain"
                transition={1000}
              />
              
                <TouchableOpacity onPress={()=>setAvatarModalVisible(true)} style={[{marginTop:25,flexDirection:"row"},estilos.centrado]}>
                  <ThemedText type='title'>{contexto.user.username}</ThemedText>
                  <Ionicons style={styles.icon} name='pencil' size={22} color={paleta.aqua} />
                </TouchableOpacity>

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

                    {contexto.user.is_prof ? 
                    <TouchableOpacity onPress={()=>{setInstModalVisible(true)}} style={[styles.infoContainer]}>
                      <ThemedText >Institución</ThemedText>
                      <View style={{flexDirection:"row"}}>
                        <ThemedText lightColor='gray'>{contexto.user.institution}</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                      </View>
                    </TouchableOpacity> : null
                  }

                    <TouchableOpacity onPress={()=>{setPassModalVisible(true)}} style={[styles.infoContainer,{borderBottomRightRadius:15, borderBottomLeftRadius:15,borderBottomWidth:0}]}>
                      <ThemedText >Cambiar contraseña</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                    </TouchableOpacity>

                {contexto.user.is_prof ? (
                  <View>
                    <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", margin:15}}>Reportes</ThemedText>
                    <TouchableOpacity onPress={abrirModalReportes} style={[styles.infoContainer,estilos.shadow,{borderBottomRightRadius:15, borderBottomLeftRadius:15,borderBottomWidth:0,borderTopRightRadius:15, borderTopLeftRadius:15}]}>
                      <ThemedText >Videos Reportados</ThemedText>
                      <View style={{flexDirection:"row", alignSelf:"flex-end"}}>
                        <ThemedText lightColor='gray'>{reportes.length}</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray"/>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : null}


                    <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", margin:15}}>Cuenta</ThemedText>
                    <TouchableOpacity onPress={eliminar_cuenta} style={[styles.infoContainer,estilos.shadow,{borderBottomRightRadius:15, borderBottomLeftRadius:15,borderBottomWidth:0,borderTopRightRadius:15, borderTopLeftRadius:15}]}>
                      <ThemedText >Eliminar cuenta</ThemedText>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color="lightgray" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.iconButton,estilos.shadow]} onPress={salir}   >  
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

            <SmallPopupModal setVisible={setInstModalVisible} modalVisible={instModalVisible} title="Editar institución">
              <ThemedText type='defaultSemiBold' lightColor='gray' style={{alignSelf:"flex-start", marginTop:25,marginHorizontal:15}}>Institución </ThemedText>
              <IconTextInput 
                icon={{Ionicon_name: "business-outline"}} 
                value={institucion} 
                bck_color="white"
                onChange={handleInstitutionChange}
                keyboardType='default'
                placeholder={contexto.user.institution} />
                { errorI ? <ThemedText type='error'>{errorI}</ThemedText>:null}

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

            <SmallPopupModal title='Reportes recibidos' modalVisible={reportesModalVisible} setVisible={setReportesModalVisible}>
              {loadingReportes ? (
                <ThemedText>Cargando...</ThemedText>
              ) : reportes.length === 0 ? (
                <ThemedText>No tienes reportes.</ThemedText>
              ) : (
                <ScrollView style={{maxHeight: 500}}>
                  {reportes.map((rep, idx) => (
                    <View key={rep.id || idx} style={{marginBottom: 15, padding: 10, backgroundColor: "#f6f6f6", borderRadius: 10}}>
                      <ThemedText type='defaultSemiBold'>Motivo: {rep.Motivos_reporte?.descripcion || rep.motivo}</ThemedText>
                      <ThemedText>Comentario: {rep.comentario || "Sin comentario"}</ThemedText>
                      {rep.Senias && (
                        <>
                          <ThemedText style={{marginTop: 8}}>Seña reportada: <ThemedText type='defaultSemiBold'>{rep.Senias.significado}</ThemedText></ThemedText>
                          <VideoPlayer uri={rep.Senias.video_url} style={{height: 120, borderRadius: 8, marginVertical: 8}} />
                          <TouchableOpacity
                            style={[estilos.shadow, {backgroundColor: "#ffe066", borderRadius: 8, padding: 8, marginTop: 10, alignSelf: "flex-start"}]}
                            onPress={() => {
                              router.push({
                                pathname: "/tabs/Diccionario/editar_senia",
                                params: {
                                  id_senia: rep.Senias.id,
                                  url: rep.Senias.video_url,
                                  significado: rep.Senias.significado,
                                  cate: rep.Senias.categoria
                                }
                              });
                              setReportesModalVisible(false);
                            }}
                          >
                            <ThemedText type='defaultSemiBold'>Editar seña</ThemedText>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </SmallPopupModal>

            <SmallPopupModal title={"Cambiar avatar"} modalVisible={avatarModalVisible} setVisible={setAvatarModalVisible}>
              <View style={{alignContent:"flex-start"}}>
              <FlatList 
                keyExtractor={(item) => item.id.toString()}
                style={[{height:  420}]}
                data={avatares}
                renderItem={renderAvatar}
                numColumns={3}
                columnWrapperStyle={{marginRight:5}}
              />
              </View>
              
            </SmallPopupModal>

          <Toast/>
        </View>
    )
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
   mainView:{
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    height: '100%',
    marginBottom: 60,
    paddingTop:30 ,
    
  },
  headerContainer: {
    flex:1,
    margin: 70,
    alignItems: 'center',
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
  
  cancelButton:{
      width:"80%",
      borderWidth: 1, 
      borderColor: '#7209B7',
      backgroundColor: '#fff',
  },
  icon: {
      marginRight: 10,
      marginLeft: 10
  },
  image: {
    flex: 1,
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
  },
  round_border:{
    borderColor:paleta.aqua,
    borderWidth:2,
    borderRadius: 40,
    backgroundColor:paleta.turquesa
  },
});
