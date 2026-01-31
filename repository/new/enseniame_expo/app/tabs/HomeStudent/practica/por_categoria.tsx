import React, { useState,  useCallback,  } from 'react';
import { View, Text, StyleSheet, Pressable,  Modal, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import {  Insignia, Modulo, Senia_Alumno } from '@/components/types';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { error_alert } from '@/components/alert';
import { paleta, paleta_colores } from '@/components/colores';
import { BotonLogin } from '@/components/botones';
import { estilos } from '@/components/estilos';
import { ThemedText } from '@/components/ThemedText';
import { XPCard } from '@/components/cards';
import { Image } from 'expo-image';
import { awardXPClient } from '@/conexiones/xp';
import { aprendiendo_dominadas_practica_x_cate, aprendiendo_practica_x_cate, traer_senias_practica_x_cate } from '@/conexiones/practica';
import { shuffleArray } from '@/components/validaciones';
import { FlashCardNombre, FlashCardVideo } from '@/components/practica_lecciones';
import { buscar_modulo } from '@/conexiones/modulos';
import { buscarCategoria } from '@/conexiones/categorias';
import { ModalInsignia } from '@/components/modals';
import { buscar_insignia, ganar_insignia_modulo, ganar_insignia_senia } from '@/conexiones/insignias';
import VideoPlayer from '@/components/VideoPlayer';


export default  function Practica (){
    const contexto = useUserContext();
    const { id=0, opcion=0 } = useLocalSearchParams<{ id: string, opcion: string }>();
    if (id==0 || opcion==0) router.back();

    const [senias,setSenias]= useState<Senia_Alumno[]>([]);
    const [categoria,setCate] = useState<{id:number,nombre:string}>({id:0,nombre:""});  
    const [loading, setLoading] = useState(true);
    const [senia_actual,setSeniaActual] = useState<Senia_Alumno>();
    const [index_actual,setIndex] =useState(0);
    const [mostrar_res,setMostrarRes]= useState(false);

    const [terminado,setTerminado] = useState(false);
    const [cant_correctas,setCorrectas] = useState(0);

    const [showModalInsignia,setShowInsignia] =useState(false);
    const [insignia,setI]= useState<Insignia>({id:0,nombre:"",descripcion:"",image_url:"",motivo:1,ganada:true});
    
    const fracaso =require("../../../../assets/images/disappointedBeetle.gif");
    const festejo =require("../../../../assets/images/beetle_celebration.gif");
    const ok =require("../../../../assets/images/beetle_bow.gif");

    useFocusEffect(
        useCallback(() => {
            fetch_senias();
            fetch_categoria();
        },[])
    );

    const fetch_categoria = async ()=>{
      try {
        setLoading(true)
        const m = await buscarCategoria(Number(id));
        setCate(m);        
      } catch (error) {
        error_alert("No se pudo cargar la categoría");
        console.error(error);
      } finally {
          setLoading(false);
      }
    } 

    const fetch_senias = async ()=>{
        try {
            let s: Senia_Alumno[] =[];
                  
            if (opcion=="2") s = await  aprendiendo_practica_x_cate(contexto.user.id,Number(id))
            else if (opcion=="3") s = await aprendiendo_dominadas_practica_x_cate(contexto.user.id,Number(id));
            else s = await traer_senias_practica_x_cate(contexto.user.id,Number(id));
            
            shuffleArray(s);            
            
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
            try {
                await awardXPClient(contexto.user.id,cant_correctas*2);
                contexto.actualizar_info(contexto.user.id);

                await ganar_insignia_senia(contexto.user.id);
                await ganar_insignia_modulo(contexto.user.id);

                /* //debug
                const i = await buscar_insignia(1);
                setShowInsignia(true);
                setI(i); */
            } catch (error) {
                error_alert("Ocurrió un error al guardar tu progreso");
                console.error(error)
            } finally {
                setTerminado(true);
            }
            
        }        
    }
    

    return (
        <View style={styles.container}>
            <View style={[estilos.centrado,{flexDirection:"row",justifyContent:"space-between",marginTop:50, marginBottom: 20,width:"100%"}]}>
                <Pressable
                style={[styles.backBtn]}
                onPress={() => { router.push({ pathname: '/tabs/Modulos_Alumno/modulo_detalle', params: { id: categoria?.id } })} }
            >
                <Ionicons name="arrow-back" size={25} color="#20bfa9" style={{ marginRight: 6 }} />                
            </Pressable>
            <ThemedText style={styles.moduleTitle}>{categoria?.nombre}</ThemedText>
            <View style={{width:20}}></View>
            </View>                        

            {senia_actual && index_actual%2==0 &&  (
                <FlashCardVideo currentIndex={index_actual+1} senia_actual={senia_actual} 
            setMostrarRes={setMostrarRes} total={senias.length}/> 
            )}     

            {senia_actual && index_actual%2!=0 &&  (
                <FlashCardNombre currentIndex={index_actual+1} senia_actual={senia_actual} 
            setMostrarRes={setMostrarRes} total={senias.length}/> 
            )}                        
            
            <Modal animationType="slide"
                transparent={true}
                visible={mostrar_res}
                onRequestClose={() => setMostrarRes(false)}>
                {senia_actual && 
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Respuesta:</Text>
                        <VideoPlayer 
                            uri={senia_actual.info.video_url}
                            style={styles.video}
                        /> 
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
        <ModalInsignia modalVisible={showModalInsignia} setVisible={setShowInsignia} insignia={insignia} cerrar={()=>{setShowInsignia(false),setTerminado(true)}} />
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
 },
 moduleTitle:{
    alignSelf: "center",
    fontSize: 25,
    color: paleta.dark_aqua,
    fontWeight: "600"
 }
})