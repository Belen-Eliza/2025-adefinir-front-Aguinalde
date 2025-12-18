import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useUserContext } from '@/context/UserContext';
import { Modulo, Senia } from '@/components/types';
import { mis_senias } from '@/conexiones/videos';
import { error_alert } from '@/components/alert';
import { paleta } from '@/components/colores';
import { mis_modulos } from '@/conexiones/modulos';
import { visualizaciones_profe } from '@/conexiones/visualizaciones';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { calificacionesProfe } from '@/conexiones/calificaciones';
import { estilos } from '@/components/estilos';

type Vistas = {
  alumno: number,
  senia: number,
  Senias : Senia,
}

type Calificaciones = {
  id_alumno: number;
  id_modulo: number;
  puntaje: number;
  comentario? : string;
  created_at: string
}
type aux={
  id:number;
  Calificaciones_Modulos: Calificaciones[];
}

export default function HomeTeacher() {
  const contexto = useUserContext();
  const teacherName = 'Prof. ' + contexto.user.username;
  const [misSenias, setSenias] = useState<Senia[]>();
  const [misModulos, setModulos] = useState<Modulo[]>();
  const [visualizaciones, setVisualizaciones] = useState<Vistas[]>();
  const [calificaciones_profe,setCalificacionesProfe] = useState<aux[]>()
  const [promedio,setPromedio] = useState(0);
  const [cant_reviews,setCantReviews] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      return () => {
      };
    }, [])
  );

  const fetchStats = async ()=>{
    try {
      const data= await mis_senias(contexto.user.id);
      setSenias(data || []);

      const data_m = await mis_modulos(contexto.user.id);
      setModulos(data_m || []);

      const vistas = await visualizaciones_profe(contexto.user.id);
      setVisualizaciones(vistas || []);

      const reviews = await calificacionesProfe(contexto.user.id);
      setCalificacionesProfe(reviews || []);
      if (reviews) calcularPromedio(reviews)
      
    } catch (error) {
      error_alert("Error al buscar las estadísticas");
      console.error(error);
    }
  }

  const calcularPromedio = (reviews: aux[])=>{
    let promedio = 0;
    let cantidad_reviews =0;
    reviews?.forEach(each=>{
      each.Calificaciones_Modulos.forEach(each=>{
        promedio+=each.puntaje;
        cantidad_reviews++
      })
    })
    promedio=promedio/ cantidad_reviews;
    setPromedio(promedio);
    setCantReviews(cantidad_reviews);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Panel del Profesor</Text>
        <Text style={styles.subtitle}>Bienvenido, {teacherName}</Text>
        {contexto.user.id==1 && (
          <ThemedText style={[styles.subtitle,{marginBottom:10}]} >(Admin)</ThemedText>
        )}

        <View style={styles.stackCards}>
          <TouchableOpacity style={[styles.card, styles.cardLeft]} onPress={()=>router.push("/tabs/HomeTeacher/vistas")}> 
            <Ionicons name="flame" size={28} color={paleta.strong_yellow} style={{marginBottom: 8}} />
            <Text style={styles.cardTitleCursos}>{visualizaciones?.length} {visualizaciones?.length==1 ? "vista" : "vistas"} en tus videos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardRight]} onPress={()=>contexto.user.gotToModules()}> 
            <Text style={styles.cardTitleCursos}>{misSenias?.length} </Text>
            <Text style={styles.cardTextCursos}> señas subidas</Text>

            <Text style={styles.cardTitleCursos}>{misModulos?.length} </Text>
            <Text style={styles.cardTextCursos}> {misModulos && misModulos.length != 1 ? "módulos creados":"módulo creado"} </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.card, {marginVertical: 8}]} onPress={()=>{router.push("/tabs/HomeTeacher/ranking")}} >
          <ThemedText type='defaultSemiBold'>Tus calificaciones:</ThemedText>
          {cant_reviews>0?
          <>
          <ThemedText style={[estilos.centrado,{margin:5}]} type='title'>{promedio.toFixed(2)}</ThemedText>
          <ThemedText>{cant_reviews} reseñas en tus módulos</ThemedText>
          </>:
          <ThemedText lightColor='gray'>Todavía no tienes ninguna calificación</ThemedText>
        }
          <ThemedText style={[estilos.centrado,{marginTop:10}]} lightColor={paleta.dark_aqua}>Ver ranking</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaButtonCursos} onPress={()=>contexto.user.gotToModules()}>
          <Ionicons name="albums-outline" size={24} color="#fff" style={styles.ctaIcon} />
          <Text style={styles.ctaButtonTextCursos}>Mis módulos</Text>
        </TouchableOpacity>
        <View style={styles.cardRow}>
          <TouchableOpacity onPress={()=>{router.push('/tabs/video_upload_form');}} style={styles.quickActionCardCursos}>
            <Ionicons name="videocam-outline" size={22} color="#20bfa9" />
            <Text style={styles.quickActionTextCursos}>Subir video de seña</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCardCursos} onPress={()=>{if (contexto.user.id==1)router.push("/tabs/HomeTeacher/moderar")}}>
            <Ionicons name={contexto.user.id==1 ? "alert-circle-outline" : "school-outline"} size={22} color="#20bfa9" />
            <Text style={styles.quickActionTextCursos}>{contexto.user.id==1 ? "Moderar" :"Ver progreso de estudiantes"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7f2',
    position: 'relative',
    paddingTop: 0,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 60,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 100,
    marginBottom: 10,
    alignSelf: 'center',
    zIndex: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#20bfa9',
    fontWeight: '500',
    marginBottom: 7,
    alignSelf: 'center',
    zIndex: 2,
  },
  
  ctaButtonCursos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20bfa9',
    borderRadius: 14,
    height: 50,
    marginBottom: 18,
    marginTop: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonTextCursos: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionCardCursos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickActionTextCursos: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'System',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffb703',
    borderRadius: 14,
    height: 44,
    marginBottom: 8,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#20bfa9',
  },
  quickActionText: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  stackCards: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    flex: 1, 
    alignItems: 'flex-start',
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  cardLeft: {
    marginRight: 6,
  },
  cardRight: {
    marginLeft: 6,
  },
  cardTitleCursos: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  cardTextCursos: {
    fontSize: 15,
    color: '#222',
    opacity: 0.8,
    marginBottom: 6,
    fontFamily: 'System',
  },
});
