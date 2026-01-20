import React, { useState, useEffect, useCallback,  } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import {  Senia_Alumno } from '@/components/types';
import { router, useFocusEffect } from 'expo-router';
import { error_alert } from '@/components/alert';
import { traer_senias_practica } from '@/conexiones/senia_alumno';
import { paleta, paleta_colores } from '@/components/colores';
import { BotonLogin } from '@/components/botones';
import { estilos } from '@/components/estilos';
import VideoPlayer from '@/components/VideoPlayer';
import { ThemedText } from '@/components/ThemedText';
import { XPCard } from '@/components/cards';
import { Image } from 'expo-image';
import { awardXPClient } from '@/conexiones/xp';


export default  function Practica (){
    const contexto = useUserContext();

    const [senias,setSenias]= useState<Senia_Alumno[]>([]);
    const [senia_actual,setSeniaActual] = useState<Senia_Alumno>();
    const [index_actual,setIndex] =useState(0);
    const [mostrar_res,setMostrarRes]= useState(false);

    const [terminado,setTerminado] = useState(false);
    const [cant_correctas,setCorrectas] = useState(0);
    
    const fracaso =require("../../../assets/images/disappointedBeetle.gif");
    const festejo =require("../../../assets/images/beetle_celebration.gif");
    const ok =require("../../../assets/images/beetle_bow.gif");

    useFocusEffect(
        useCallback(() => {
            fetch_senias();
        },[])
    );

    const fetch_senias = async ()=>{
        try {
            const s=await traer_senias_practica(contexto.user.id);
            //elegir 5 para la práctica
            const muestra =s.slice(0,5);
            setSenias(muestra);
            setSeniaActual(muestra[0]);
        } catch (error) {
            console.error(error);
            contexto.user.goHome();
            setTimeout(()=>error_alert("No se pudo cargar la práctica"),200)            
        }        
    } 

    const exito = async () => {
        try {
            senia_actual?.sumar_acierto(contexto.user.id);
            setCorrectas(cant_correctas+1)
        } catch (error) {
            console.error(error);
            error_alert("Ocurrió un error al guardar tu progreso")
        } finally {
            next();
        }        
    }

    const next = async ()=>{
        let nuevo_index= index_actual+1;
        if (nuevo_index<senias.length) {
            setSeniaActual(senias[nuevo_index]);
            setIndex(nuevo_index);
            setMostrarRes(false);
        }  else {
            //terminar
            setMostrarRes(false);
            setTerminado(true); 
            try {
                await awardXPClient(contexto.user.id,cant_correctas*2);
                contexto.actualizar_info(contexto.user.id)
            } catch (error) {
                error_alert("Ocurrió un error al guardar tu progreso");
                console.error(error)
            }
            
        }        
    }
    

    return (
        <View style={styles.container}>
            <Pressable
                style={[styles.backBtn, { marginBottom: 10, marginTop:30, flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => { contexto.user.goHome()} }
            >
                <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnText}>Volver</Text>
            </Pressable>

            <View style={[styles.bck_content,estilos.centrado]}>                
                {senia_actual && 
                    <View style={estilos.centrado}>
                        <ThemedText style={[styles.title]}>Identificar el significado de la seña</ThemedText>
                        <View style={[styles.card,paleta_colores.dark_aqua,{width:"95%"}]}>
                        
                        <VideoPlayer 
                        uri={senia_actual.info.video_url}
                        style={styles.video}
                        />
                        <BotonLogin callback={()=>setMostrarRes(true)} 
                            textColor={'white'} bckColor={paleta.blue} text={'Ver respuesta'}    />
                        </View>
                    </View>
                }                           
            </View>
            <Modal animationType="slide"
                transparent={true}
                visible={mostrar_res}
                onRequestClose={() => setMostrarRes(false)}>
                {senia_actual && 
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Respuesta:</Text>
                        <ThemedText  style={[styles.modalTitle,{color:paleta.dark_aqua}]} >{senia_actual.info.significado}</ThemedText>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity onPress={exito}
                            style={[styles.button,estilos.centrado,{backgroundColor:paleta.turquesa}]}>
                                <ThemedText type='bold' lightColor='black'>La supe</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={next}
                            style={[styles.button,estilos.centrado,{backgroundColor:paleta.strong_yellow}]}>
                                <ThemedText type='bold' lightColor='white'>No la supe</ThemedText>
                            </TouchableOpacity>
                        </View>
                        </View>
                    </View>
                }
            </Modal>
            <Modal
                visible={terminado}
                animationType="fade"
                transparent={true}
            >
          <View style={[styles.modalContainerRacha,estilos.centrado]}>
            <View style={[styles.modalContent2,{height:"100%"}]}>
              {cant_correctas==0 ? (
                <View>
                    
                    <Image
                      style={[styles.modal_image,estilos.centrado]}
                      source={fracaso}
                      contentFit="contain"
                      transition={0}
                    />
                    <Text style={[styles.title_racha]}>Hoy no es tu día</Text>
                    <ThemedText type='defaultSemiBold' style={estilos.centrado} lightColor={paleta.dark_aqua}>0 de {senias.length} correctas</ThemedText>
                    <ThemedText type='defaultSemiBold' lightColor={paleta.dark_aqua}>Sigue practicando para volver a encaminarte</ThemedText>
                
                <BotonLogin callback={()=>{contexto.user.goHome();setTerminado(false)}} textColor={'black'} bckColor={paleta.turquesa} text={'Aceptar'}  />
                </View>
                ):(
                  <View  >
                    <ThemedText style={[styles.title_racha]}>¡Completaste la lección!</ThemedText>
                    <View style={{width:"100%",height: cant_correctas==senias.length ? 300:250}}>
                    <Image
                      style={[styles.modal_image,estilos.centrado]}
                      source={cant_correctas==senias.length ? festejo: ok}
                      contentFit="contain"
                      transition={0}
                    />  
                    </View>
                                                            
                    <View style={[{width:400,paddingVertical: cant_correctas==senias.length ? 15: 30},estilos.centrado]}>
                        <XPCard borderColor={paleta.blue} bckColor={paleta.blue} textColor={'white'} 
                    title={'XP ganado'} cant={""+cant_correctas*2} icon='barbell' iconColor={paleta.dark_aqua}/>
                    </View>
                  
                    <View style={[{flexDirection:"row",width:400},estilos.centrado]}>
                        <View style={{width:190}}>
                            <XPCard borderColor={paleta.strong_yellow} bckColor={paleta.strong_yellow} textColor={'white'} 
                            title={'Aciertos'} cant={""+cant_correctas} />
                        </View>
                        <View style={{width:190}}>
                            <XPCard borderColor={paleta.sea_green} bckColor={paleta.sea_green} textColor={'white'} 
                        title={'Precisión'} cant={cant_correctas/senias.length*100+" %"}/>
                        </View>                                                
                    </View>
                
                <BotonLogin callback={()=>{contexto.user.goHome();setTerminado(false)}} textColor={'black'} bckColor={paleta.turquesa} text={'Aceptar'}  />
                    </View>
                
                )}                                          
                
              
            </View>
          </View>
        </Modal>
            <Toast/>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: paleta.aqua_bck,
    padding: 16,
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
  bck_content:{
    width: "100%",
    backgroundColor: "#ffffffff",
    height: "85%"
  },
  video: {
    width: '95%',
    aspectRatio: 16/9,
    borderRadius: 12,
    marginBottom: 25
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    //marginBottom: 34,
    shadowColor: "#222",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop:20,
    color: "black",
    
  },
   modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#222",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalContent2: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#222",
  },
  buttonRow:{
    flexDirection:"row",
    padding: 10,
    alignContent:"space-around",
    justifyContent:"space-between"
  },
  button: {
    paddingVertical: 5,
    width: 140,
    height: 60,
    borderRadius: 20,
    marginHorizontal: 5
  },
  modalContainerRacha: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'white',
    height:"100%",
    width:"100%"
  },
  modal_image:{
    flex: 2,
    width: "120%",
    height: "120%", 
},

title_racha: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,    
    color: paleta.dark_aqua,
    alignSelf: "center",
  },
 xpcards:{
    position:"absolute",
    top: 400,
    width:"100%"
 }
})