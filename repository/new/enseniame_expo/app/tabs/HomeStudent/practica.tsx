import React, { useState, useEffect, useCallback,  } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { Estado_Pendiente, Senia, Senia_Alumno } from '@/components/types';
import { router, useFocusEffect } from 'expo-router';
import { traer_tabla_videos } from '@/conexiones/videos';
import { error_alert } from '@/components/alert';
import { traer_senias_practica } from '@/conexiones/senia_alumno';
import { paleta } from '@/components/colores';
import { BotonLogin } from '@/components/botones';
import { estilos } from '@/components/estilos';
import VideoPlayer from '@/components/VideoPlayer';


export default  function Practica (){
    const contexto = useUserContext();

    const [senias,setSenias]= useState<Senia_Alumno[]>([]);
    const [senia_actual,setSeniaActual] = useState<Senia_Alumno>();
    const [index_actual,setIndex] =useState(0);
    const [mostrar_res,setMostrarRes]= useState(false);

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

    const next = ()=>{
        let nuevo_index= index_actual+1;
        if (nuevo_index<=senias.length) {
            setSeniaActual(senias[nuevo_index]);
            setIndex(nuevo_index);
            setMostrarRes(false)
        }  else {
            //terminar
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

            
            {mostrar_res ? (
                <View>
                    {senia_actual && 
                        <View>
                            <VideoPlayer 
                                uri={senia_actual.info.video_url}
                                style={styles.video}
                                />
                            <BotonLogin callback={()=>setMostrarRes(true)} 
                                textColor={'white'} bckColor={paleta.dark_aqua} text={'Ver respuesta'}    />
                        </View>
                    }
                </View>
            ):(
                <View>
                    {senia_actual && 
                        <View>

                            <BotonLogin callback={next} textColor={'black'} bckColor={paleta.strong_yellow} text={'Continuar'}    />
                        </View>
                    }
                </View>
            )}
            </View>
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
    width: "90%",
    backgroundColor: "#ffffffff",
    height: "85%"
  },
  video: {
    width: '95%',
    aspectRatio: 16/9,
    borderRadius: 12,
    marginBottom: 25
  },
})