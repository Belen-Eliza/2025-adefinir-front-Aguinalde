import React, { useCallback,  useState } from "react";
import { View, Text, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import {  Modulo } from "@/components/types";
import { buscar_modulo } from "@/conexiones/modulos";
import { ThemedText } from "@/components/ThemedText";
import { Image } from 'expo-image';
import { paleta, paleta_colores } from "@/components/colores";
import { useUserContext } from "@/context/UserContext";
import Toast from "react-native-toast-message";
import { error_alert, success_alert } from "@/components/alert";
import { estilos } from "@/components/estilos";
import { BotonLogin } from "@/components/botones";

export default function ModuloCompletado (){
    const { id=0 } = useLocalSearchParams<{ id: string }>();
    if (id==0) router.back();
    const [modulo,setModulo] = useState<Modulo | undefined>();
    const [loading, setLoading] = useState(true);

    const contexto = useUserContext();

    const animation = require("../../../../assets/images/disappointedBeetle.gif")
     
    useFocusEffect(
          useCallback(() => {
              fetch_modulo();                            
              return () => {};
          }, [])
    );

    const fetch_modulo = async ()=>{
        try {
          setLoading(true)
          const m = await buscar_modulo(Number(id));
          setModulo(m || []);
          
        } catch (error) {
            error_alert("No se pudo cargar el módulo");
            console.error(error)
        } finally {
            setLoading(false)
        }
    }     

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#20bfa9" />
        </View>
        );
    }

      return (
        <View style={styles.container}>
            <Text style={styles.title}> Lección finalizada</Text>
            <Text style={[styles.cardTitle,estilos.centrado,{textAlign:"center"}]}>
                Completaste la lección {modulo?.nombre}, pero aún quedan señas por aprender.
            </Text>

            <Image
              style={[styles.image,estilos.centrado]}
              source={animation}
              contentFit="contain"
              transition={0}
            />
            <Text style={[styles.cardTitle,estilos.centrado,{textAlign:"center"}]}>
                ¡Sigue practicando para completar el módulo!
            </Text>
            
            <BotonLogin callback={()=>{router.back();router.push({ pathname: '/tabs/Modulos_Alumno/lecciones', params: { id: modulo?.id } })}} 
            textColor={"white"} bckColor={paleta.dark_aqua} text={"Reintentar lección"} />
            <Pressable style={[estilos.centrado,{padding:13}]} onPress={()=>{router.back();contexto.user.goHome()}}>
                <ThemedText style={{fontSize:20}} type='bold' lightColor={paleta.dark_aqua}>Cerrar</ThemedText>
            </Pressable>
           
            <Toast/>
        </View>
      )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6f7f2",
    padding: 16,
    paddingTop: 40
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    marginTop:60,
    color: "#005348ff",
    alignSelf: "center",
  },
  
  cardTitle: {
    color: paleta.dark_aqua,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#20bfa9",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    paddingHorizontal: 5,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: paleta.aqua_bck
  },
  checkbox: {
    margin: 8,
    borderRadius:10,
    borderColor: paleta.strong_yellow 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 6
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#222'
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
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
   image: {
    height: 400,
    width:"100%",
    margin:0 
  },
});
