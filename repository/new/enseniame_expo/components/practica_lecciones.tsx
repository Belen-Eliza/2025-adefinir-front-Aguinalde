import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Senia_Alumno } from './types';
import { BotonLogin } from './botones';
import VideoPlayer from './VideoPlayer';
import { ThemedText } from './ThemedText';
import { estilos } from './estilos';
import { paleta, paleta_colores } from './colores';


function FlashCardVideo ({senia_actual,setMostrarRes}:{senia_actual:Senia_Alumno,setMostrarRes:React.Dispatch<React.SetStateAction<boolean>>}){

    return (
        <View style={[styles.bck_content,estilos.centrado]}>                
            
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
                                      
        </View>
    )
}

export {FlashCardVideo }

const styles = StyleSheet.create({
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
    
  }
})