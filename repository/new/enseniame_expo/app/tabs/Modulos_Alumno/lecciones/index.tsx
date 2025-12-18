import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet,  ActivityIndicator,  } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Senia_Info, Modulo } from "@/components/types";
import { alumno_completo_modulo, buscar_modulo, buscar_senias_modulo, completar_modulo_alumno } from "@/conexiones/modulos";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import VideoPlayer from "@/components/VideoPlayer";
import { paleta, paleta_colores } from "@/components/colores";
import { useUserContext } from "@/context/UserContext";
import Toast from "react-native-toast-message";
import { alumno_ver_senia, senias_aprendidas_alumno, visualizaciones_alumno } from "@/conexiones/visualizaciones";
import { error_alert, success_alert } from "@/components/alert";
import Checkbox from "expo-checkbox";
import { marcar_aprendida, marcar_no_aprendida } from "@/conexiones/aprendidas";
import { estilos } from "@/components/estilos";

type Senia_Aprendida ={
  senia: Senia_Info;
  vista: boolean;
  aprendida: boolean;
  descripcion?: string
}

export default function Leccion (){
  const { id=0 } = useLocalSearchParams<{ id: string }>();
  if (id==0) router.back();
  const [modulo,setModulo] = useState<Modulo>();
  const [completado,setCompletado] =useState(false);
  const [senias,setSenias] = useState<Senia_Aprendida[]>([]);
  const [cant_aprendidas, setCantAprendidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSenia, setSelectedSenia] = useState<Senia_Aprendida | null>(null);
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

        const c = await alumno_completo_modulo(contexto.user.id,Number(id));            
        setCompletado(c);
        
      } catch (error) {
        error_alert("No se pudo cargar el módulo");
        console.error(error);
      } finally {
          setLoading(false);
      }
    } 

    const fetch_senias = async () => {
        try {
          setLoading(true);
         
          const s = await  buscar_senias_modulo(Number(id));
          const vistas = await visualizaciones_alumno(contexto.user.id);
          const aprendidas = await senias_aprendidas_alumno(contexto.user.id);

          const fue_vista = (senia_id:number)=>{
            let res = false;
            vistas?.forEach(each=>{
              if (each.senia==senia_id) res= true
            });
            return res
          }
          
          const fue_aprendida =(senia_id:number)=>{
            let res = false;
            aprendidas?.forEach(each=>{
              if (each.senia_id==senia_id && each.aprendida) {
                setCantAprendidas(prev=>prev+=1);
                res= true;
              }
            });
            return res
          }
    
          const senias_vistas = s?.map(each=>{
            let vista = fue_vista(each.Senias.id);
            return {senia:each.Senias, vista:vista, descripcion:each.descripcion}
          });
          
          const senias_vistas_aprendidas =senias_vistas?.map(each=>{
            let aprendida = fue_aprendida(each.senia.id);
            return {senia:each.senia, vista:each.vista,aprendida:aprendida,descripcion:each.descripcion}
          });                          
          
          if (senias_vistas_aprendidas && senias_vistas_aprendidas.length>0)  {
            const ordered =senias_vistas_aprendidas.sort(function (a, b) {
              if (a.senia.significado < b.senia.significado) {
                return -1;
              }
              if (a.senia.significado > b.senia.significado) {
                return 1;
              }
              return 0;
            })
            
            setSenias(ordered);
            const item = ordered[0];
            if (!item.vista){
              alumno_ver_senia(contexto.user.id,item.senia.id)
                .catch(reason=>{
                  error_alert("No se pudo guardar tu progreso");
                  console.error(reason);
                })
                .then(()=>{
                  item.vista= true
                })              
            }
            setSelectedSenia(item);
          }
            
        } catch (error) {
            error_alert("No se pudieron cargar las señas");
          console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const next =async ()=>{
      const i = senias.findIndex(each=>each.senia.id==selectedSenia?.senia.id);
      if (i!=-1 && i<senias.length-1) {
        setIndex(i+1);
        setSelectedSenia(senias[i+1]);
        const item = senias[i+1];
        if (!item.vista){
          alumno_ver_senia(contexto.user.id,item.senia.id)
            .catch(reason=>{
              error_alert("No se pudo guardar tu progreso");
              console.error(reason);
            })
            .then(()=>{
              item.vista= true
            })              
        }
      }
      else {
        //terminar lección                   
        try {      
                         
          if (cant_aprendidas==senias.length) {                                     
            await completar_modulo_alumno(contexto.user.id,Number(id));
            router.navigate({ pathname: '/tabs/Modulos_Alumno/lecciones/completado', params: { id: id } })
          } else {            
            router.navigate({ pathname: '/tabs/Modulos_Alumno/lecciones/no_completado', params: { id: id } });
          }
          
        } catch (error) {
          console.error(error);
          router.back()
          contexto.user.gotToModules();
          setTimeout(()=>error_alert("Ocurrió un error al completar el módulo"),300)
        }                                                  
      }
    }

    const toggleAprendida = async (info_senia: Senia_Aprendida, value: boolean) => {
      
      if (value) {
        marcar_aprendida(info_senia.senia.id,contexto.user.id)
          .catch(reason =>{
            console.error(reason);
            error_alert("No se pudo actualizar el estado");
          })
          .then(()=>{
            success_alert('Marcada como aprendida' );
            info_senia.aprendida= value;
            setCantAprendidas((prev) => (prev+=1));   
          });            
      } else if (!completado) {
        marcar_no_aprendida(info_senia.senia.id,contexto.user.id)
          .catch(reason=>{
            console.error(reason);
            error_alert("No se pudo actualizar el estado")
          })
          .then(()=>{
            success_alert( 'Marcada como no aprendida');
            info_senia.aprendida= value;
            setCantAprendidas((prev) => (prev-=1));   
          })
      } else {
        alert("No puedes marcar como no aprendida una seña en un módulo completado");
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
                      uri={selectedSenia.senia.video_url}
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
                        <ThemedText style={styles.cardTitle}>{selectedSenia.senia.significado}</ThemedText>
                        <View style={{alignSelf:"flex-start"}}>
                          <ThemedText lightColor="gray">Categoría: </ThemedText>
                          <ThemedText lightColor="gray">{selectedSenia.senia.Categorias.nombre}</ThemedText>
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
                                value={selectedSenia.aprendida}
                                onValueChange={(v) => toggleAprendida(selectedSenia, v)}
                                color={selectedSenia.aprendida ? paleta.turquesa : undefined}
                                style={styles.checkbox}
                              />
                              <Text style={styles.checkboxLabel}>Aprendida</Text>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
