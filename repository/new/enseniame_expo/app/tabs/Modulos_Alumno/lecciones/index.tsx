import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet,  ActivityIndicator,  } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import {  Modulo, Senia_Alumno } from "@/components/types";
import {  buscar_modulo,  } from "@/conexiones/modulos";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import VideoPlayer from "@/components/VideoPlayer";
import { paleta, paleta_colores } from "@/components/colores";
import { useUserContext } from "@/context/UserContext";
import Toast from "react-native-toast-message";
import { alumno_ver_senia,} from "@/conexiones/visualizaciones";
import { error_alert, success_alert } from "@/components/alert";
import Checkbox from "expo-checkbox";
import { estilos } from "@/components/estilos";
import { traer_senias_leccion } from "@/conexiones/senia_alumno";

type Senia_Leccion ={
  senia: Senia_Alumno;    
  descripcion?: string;
  aprendiendo: boolean;
}

export default function Leccion (){
  const { id=0 } = useLocalSearchParams<{ id: string }>();
  if (id==0) router.back();
  const [modulo,setModulo] = useState<Modulo>();  
  const [senias,setSenias] = useState<Senia_Leccion[]>([]);  
  const [loading, setLoading] = useState(true);
  const [selectedSenia, setSelectedSenia] = useState<Senia_Leccion | null>(null);
  const [currentIndex,setIndex]=useState(0);

  const contexto = useUserContext();

  useFocusEffect(
    useCallback(() => {
        fetch_modulo();
        fetch_senias();
        
        return () => {};
    }, [])
    );

    const fetch_modulo = async ()=>{
      try {
        setLoading(true)
        const m = await buscar_modulo(Number(id));
        setModulo(m || {id:0,descripcion:"",nombre:"",autor:0,icon: "paw"});

      } catch (error) {
        error_alert("No se pudo cargar el módulo");
        console.error(error);
      } finally {
          setLoading(false);
      }
    } 

  const fetch_senias = async ()=>{
    try {
      setLoading(true)
      const s = await  traer_senias_leccion(contexto.user.id,Number(id)); 
      const ordenadas = s.sort(function (a, b) {
      if (a.senia.info.significado < b.senia.info.significado) {
        return -1;
      }
      if (a.senia.info.significado > b.senia.info.significado) {
        return 1;
      }
      return 0;
    })              
      setSenias(ordenadas || []);
      setSelectedSenia(ordenadas[0])
    } catch (error) {
      error_alert("No se pudo cargar las señas");
      console.error(error)
    } finally{
      setLoading(false)
    }
    
  }

    const next =async ()=>{
      const i = currentIndex;
      if ( i<senias.length-1) {
        setIndex(i+1);
        setSelectedSenia(senias[i+1]);
        const item = senias[i+1];
        await alumno_ver_senia(contexto.user.id,item.senia.info.id)
      }
      else {
        //terminar lección                   
        try {                 
          router.navigate({ pathname: '/tabs/Modulos_Alumno/lecciones/completado', params: { id: id } })        
        } catch (error) {
          console.error(error);
          router.back()
          contexto.user.gotToModules();
          setTimeout(()=>error_alert("Ocurrió un error al completar el módulo"),300)
        }                                                  
      }
    }

    const toggle_pendiente = async (item:Senia_Leccion,value:boolean) => {
      try {
        item.senia.cambiar_estado(contexto.user.id);         
        if (selectedSenia) {
          setSelectedSenia({senia:selectedSenia.senia,aprendiendo:value,descripcion:selectedSenia.descripcion})
        }                               
        success_alert(item.senia.estado.esta_aprendiendo()? "Seña marcada como aprendiendo" : "Seña marcada como pendiente" );
      } catch (error) {
        error_alert("No se pudo guardar tu progreso");
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
          <Pressable
              style={[styles.backBtn, { marginBottom: 10, marginTop:30, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => { router.push({ pathname: '/tabs/Modulos_Alumno/modulo_detalle', params: { id: modulo?.id } }) }} 
          >
          <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
            <View style={[styles.bck_content,estilos.centrado]}>
              
              <View>
                  {selectedSenia && (
                      <VideoPlayer 
                      uri={selectedSenia.senia.info.video_url}
                      style={styles.video}
                      />
                  )}
              </View>
                <View style={[styles.card,paleta_colores.dark_aqua,{width:"95%"}]}>
                    <ThemedText style={styles.title}>{modulo?.nombre}</ThemedText>
                    <ThemedText style={styles.cardSubtitle}>{modulo?.descripcion}</ThemedText>
                    <View style={styles.card}>
                        {selectedSenia ? 
                        <>
                        <View style={[{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10},estilos.thinGrayBottomBorder]}>
                        <ThemedText style={styles.cardTitle}>{selectedSenia.senia.info.significado}</ThemedText>
                        <View style={{alignSelf:"flex-start"}}>
                          <ThemedText lightColor="gray">Categoría: </ThemedText>
                          <ThemedText lightColor="gray">{selectedSenia.senia.info.Categorias.nombre}</ThemedText>
                        </View>
                        
                        </View>
                        { selectedSenia.descripcion && selectedSenia.descripcion!="" ? 
                        <ThemedText>{selectedSenia.descripcion} </ThemedText>:
                        <ThemedText>Acá va una descripcion de la seña o una aclaración en el contexto específico del módulo. 
                            Podríamos añadirlo a la tabla Senia_Modulo
                        </ThemedText>}

                        <View style={styles.row}>
                        
                        {/* Toggle Aprendida */}
                          {selectedSenia && (
                            <View style={{flexDirection:"row",alignContent:"center",justifyContent:"center"}}>
                              <Checkbox
                                value={selectedSenia.aprendiendo}
                                onValueChange={(v) => toggle_pendiente(selectedSenia,v)}
                                color={selectedSenia.aprendiendo ? '#20bfa9' : undefined}
                                style={[styles.checkbox,{display:selectedSenia.senia.estado.dominada()? "none":"flex"}]}
                              />
                              <Text style={styles.checkboxLabel}>{selectedSenia.senia.estado.toString()}</Text>
                            </View>
                          )}
                        <Pressable style={[{marginVertical:10},estilos.centrado]} onPress={next}>
                            <ThemedText type="defaultSemiBold" lightColor={paleta.strong_yellow}>Siguiente</ThemedText>
                        </Pressable>
                        </View>
                        </>
                    :null
                    }
                    </View>
                    
                    
                </View>
            </View>
            <Toast/>
        </View>
    )
    
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6f7f2",
    padding: 16,
  },
  bck_content:{
    width: "90%",
    backgroundColor: "#ffffffff",
    height: "85%"
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop:20,
    color: "white",
    
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
  cardTitle: {
    color: "#222",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    alignSelf:"center"
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
  
  video: {
    width: '95%',
    aspectRatio: 16/9,
    borderRadius: 12,
    marginBottom: 25
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
  
  checkboxLabel: {
    fontSize: 16,
    color: '#222',
    alignSelf:"center"
  },
   iconButton: {
    borderRadius: 10,
    height: 50,
    minWidth: "100%",
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: "row",
    width:"100%",
    backgroundColor: "white",
    position: "relative",
    marginTop: 25
  },
  icon:{
    flex:1,
    marginLeft: 25
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
  
 progressTotal: { color: '#555', marginBottom: 8 },
  progressBar: { height: 12, backgroundColor: '#e53838ff', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#20bfa9', borderRadius: 8 },
  progressPercent: { alignSelf: 'flex-end', color: '#20bfa9', fontWeight: 'bold', marginTop: 6 },
  
  cardSubtitle: {
    color: "white",
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:"space-between",
    marginTop: 10,
    width:"100%"
  },
});
