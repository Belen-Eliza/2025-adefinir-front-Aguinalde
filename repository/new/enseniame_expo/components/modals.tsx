import React, {  PropsWithChildren } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { paleta, paleta_colores } from "@/components/colores";
import { estilos } from "./estilos";
import { Image } from 'expo-image';
import { BotonLogin } from "./botones";
import { ThemedText } from "./ThemedText";
import { XPCard } from "./cards";
import { Insignia } from "./types";

type Props = PropsWithChildren<{
    title:string | undefined,
  modalVisible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>
}>;

function SmallPopupModal ({children,modalVisible,setVisible,title}:Props) {
    return (

        <Modal 
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setVisible(false)}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Pressable 
                    onPress={() => setVisible(false)}
                    style={styles.closeButton}
                    >
                    <Ionicons name="close" size={24} color="#014f86" />
                    </Pressable>
                </View>
                <View>{children}</View>
                </View>
            </View>
        </Modal>
        
    )
}

function ModalInsignia ({modalVisible,setVisible,insignia, cerrar}:
  {
    modalVisible:boolean,
    setVisible:React.Dispatch<React.SetStateAction<boolean>>,
    insignia: Insignia,
    cerrar: ()=>void
  }) {
  

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View style={[styles.modalContainerRacha,estilos.centrado]}>
        <View style={[styles.modalContent,{height:"100%"}]}>
          
          <View >
            
            <ThemedText  style={[styles.title_racha,{color:paleta.blue,marginTop:60}]} >{insignia.nombre}</ThemedText>
            <Image
              style={[styles.modal_image,estilos.centrado]}
              source={insignia.image_url}
              contentFit="contain"
              transition={0}
            />
            <XPCard borderColor={paleta.turquesa} bckColor={paleta.turquesa} textColor={'white'} 
              title={'XP ganado'} cant={20+""} icon='barbell' iconColor={paleta.dark_aqua}/>
            <ThemedText style={[styles.title_racha,{color:paleta.blue}]}>¡¡Ganaste una insignia!!</ThemedText>
            <ThemedText style={{textAlign:"center"}} type='defaultSemiBold' lightColor={paleta.dark_aqua}>Obtuviste una insignia por {insignia.descripcion}</ThemedText>
            <BotonLogin callback={cerrar} textColor={'black'} bckColor={paleta.sea_green} text={'Aceptar'}  />
            </View>
                                                                                  
        </View>
      </View>
    </Modal>
  )
}

const styles =StyleSheet.create({
modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: paleta.dark_aqua
  },
  closeButton: {
    padding: 8,
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
    marginBottom: 20,
    marginTop:30,
    color: paleta.blue,
    alignSelf: "center",
  },
  cardTitleCursos: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    fontFamily: 'System',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
})

export {SmallPopupModal, ModalInsignia}