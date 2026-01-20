import React, { useState, useEffect, useCallback,  } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { Senia, Senia_Alumno } from '@/components/types';
import { router, useFocusEffect } from 'expo-router';
import { traer_tabla_videos } from '@/conexiones/videos';
import { error_alert } from '@/components/alert';
import { traer_senias_practica } from '@/conexiones/senia_alumno';


export default  function Practica (){
    const contexto = useUserContext();

    const [senias,setSenias]= useState<Senia_Alumno[]>();
    const [senia_actual,setSeniaActual] = useState<Senia_Alumno>()

    useFocusEffect(
        useCallback(() => {
            fetch_senias();
        },[])
    );

    const fetch_senias = async ()=>{
        try {
            const s=await traer_senias_practica(contexto.user.id);
            //setSenias(s || []);
        } catch (error) {
            console.error(error);
            contexto.user.goHome();
            setTimeout(()=>error_alert("No se pudo cargar la práctica"),200)            
        }
        
    } 

    return (
        <View>

            <Toast/>
        </View>
    )
}

const styles = StyleSheet.create({

})