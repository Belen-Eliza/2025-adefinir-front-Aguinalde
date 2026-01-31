import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Senia_Alumno } from './types';
import { BotonLogin } from './botones';
import VideoPlayer from './VideoPlayer';
import { ThemedText } from './ThemedText';
import { estilos } from './estilos';
import { paleta, paleta_colores } from './colores';
import { ProgressBarAnimada } from './animations/ProgressBarAnimada';


function FlashCardVideo ({senia_actual,setMostrarRes,currentIndex,total}:
  {senia_actual:Senia_Alumno,
    setMostrarRes:React.Dispatch<React.SetStateAction<boolean>>,
    currentIndex:number,
    total:number
  }){

    return (
      <>
      <View style={[styles.progressBarRow,estilos.centrado]}>
          <ProgressBarAnimada progress={currentIndex/total*100} />   
          <ThemedText style={{marginLeft:6}}>{currentIndex}/{total}</ThemedText>
        </View>   
      
        <View style={[styles.bck_content,estilos.centrado]}>                             
            
          <View style={[styles.card,paleta_colores.dark_aqua,estilos.centrado]}>
          <ThemedText style={[styles.title]}>Identificar el significado de la seña</ThemedText>
          
            <VideoPlayer 
            uri={senia_actual.info.video_url}
            style={styles.video}
            />                    
          
          <BotonLogin callback={()=>setMostrarRes(true)} 
              textColor={'white'} bckColor={"#006868"} text={'Ver respuesta'}    />
          </View>        
                                      
        </View></>
    )
}

function FlashCardNombre ({senia_actual,setMostrarRes,currentIndex,total}:
  {senia_actual:Senia_Alumno,
    setMostrarRes:React.Dispatch<React.SetStateAction<boolean>>,
    currentIndex:number,
    total:number
  }){

    return (
      <>
        <View style={[styles.progressBarRow,estilos.centrado]}>
          <ProgressBarAnimada progress={currentIndex/total*100} />   
          <ThemedText style={{marginLeft:6}}>{currentIndex}/{total}</ThemedText>
        </View>   
      
        <View style={[styles.bck_content,estilos.centrado]}>                             
            
          <View style={[styles.card,paleta_colores.dark_aqua,estilos.centrado]}>
          <ThemedText style={[styles.title]}>Identificar la seña correspondiente</ThemedText>
          
            <View style={[styles.card,estilos.centrado,{marginBottom:10,height:"50%",padding:0}]}>
              <ThemedText style={[estilos.centrado,styles.texto_significado]}>
                {senia_actual.info.significado} 
              </ThemedText>
            </View>                  
          
          <BotonLogin callback={()=>setMostrarRes(true)} 
              textColor={'white'} bckColor={"#006868"} text={'Ver respuesta'}    />
          </View>        
                                      
        </View></>
    )
}

export {FlashCardVideo, FlashCardNombre }

const styles = StyleSheet.create({
    bck_content:{
    width: "100%",
    backgroundColor: "white",
    height: "85%",
    borderRadius: 20
  },
  video: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
    marginBottom: 25
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,    
    shadowColor: "#222",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    width:"95%",
    height:"70%",
    marginBottom: 100
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: "white",    
    marginBottom:40
  },
  progressBarRow:{
    flexDirection:"row",
    width:"85%",
    justifyContent:"space-between",
    marginBottom:25
  },
  texto_significado:{
    color:paleta.blue,
    fontSize:40,
    padding:30,
    lineHeight:50,
    textAlign:"center",
    fontWeight: "500"
  }
})