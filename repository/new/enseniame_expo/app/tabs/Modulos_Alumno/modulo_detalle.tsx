import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList,  TouchableOpacity, ActivityIndicator, Modal, TextInput } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Senia_Info, Modulo } from "@/components/types";
import { alumno_completo_modulo, buscar_modulo, buscar_senias_modulo, completar_modulo_alumno } from "@/conexiones/modulos";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import VideoPlayer from "@/components/VideoPlayer";
import { paleta } from "@/components/colores";
import { useUserContext } from "@/context/UserContext";
import { SmallPopupModal } from "@/components/modals";
import Toast from "react-native-toast-message";
import { alumno_ver_senia, senias_aprendidas_alumno, visualizaciones_alumno } from "@/conexiones/visualizaciones";
import { error_alert, success_alert } from "@/components/alert";
import Checkbox from "expo-checkbox";
import { marcar_aprendida, marcar_no_aprendida } from "@/conexiones/aprendidas";
import { calificacionesModulo, calificarModulo } from "@/conexiones/calificaciones";
import { RatingStars } from "@/components/review";
import { estilos } from "@/components/estilos";
import { get_antiguedad } from "@/components/validaciones";
import { AntDesign } from "@expo/vector-icons";
import { ganar_insignia_senia } from "@/conexiones/insignias";


type Senia_Aprendida ={
  senia: Senia_Info;
  vista: boolean;
  aprendida: boolean;
  descripcion?: string
}
type Calificaciones = {
  id_alumno: number;
  Users?: {username:string, id:number};
  id_modulo: number;
  puntaje: number;
  comentario? : string;
  created_at: string;
  id: number
}

export default function ModuloDetalleScreen() {
  const { id=0 } = useLocalSearchParams<{ id: string }>();
  if (id==0) router.back();
  const [modulo,setModulo] = useState<Modulo | undefined>();
  const [completado,setCompletado] =useState(false);
  const [senias,setSenias] = useState<Senia_Aprendida[]>();
  const [cant_aprendidas, setCantAprendidas] = useState(0);
  const [aprendidasMap, setAprendidasMap] = useState<Record<number, boolean>>({});
  const [calificaciones_modulo,setCalificacionesModulo] = useState<Calificaciones[]>()

  const [loading, setLoading] = useState(true);
  const [selectedSenia, setSelectedSenia] = useState<Senia_Aprendida | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [yaCalificado, setYaCalificado] = useState(false);

  const [modalCalificaciones,setModalCalificaciones] = useState(false);
  
  const contexto = useUserContext();
  
   useFocusEffect(
      useCallback(() => {
        fetch_modulo();
        fetch_senias();
        fetch_aprendidas();
        verificarCalificacion();
        return () => {};
      }, [])
    );
  const fetch_modulo = async ()=>{
    try {
      const m = await buscar_modulo(Number(id));
      setModulo(m || []);
      const calificaciones =await calificacionesModulo(Number(id));
      setCalificacionesModulo(calificaciones || []);

      const c = await alumno_completo_modulo(contexto.user.id,Number(id));            
      setCompletado(c);
    } catch (error) {
      error_alert("No se pudo cargar el módulo");
      console.error(error)
    }
  } 

  const fetch_senias = async ()=>{
    try {
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
            res= true;
            setCantAprendidas(prev=>prev+=1);            
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

      setSenias(senias_vistas_aprendidas || []);

    } catch (error) {
      error_alert("No se pudo cargar tu progreso");
      console.error(error)
    }
    
  }
  const fetch_aprendidas = async () => {
    try {
      if (!contexto.user?.id) return;
      const data = await senias_aprendidas_alumno(contexto.user.id)
      const map: Record<number, boolean> = {};
      (data || []).forEach((row: any) => {
        map[Number(row.senia_id)] = !!row.aprendida;
      });
      setAprendidasMap(map);
      setLoading(false);
    } catch (e) {
      // Si no existe la tabla o hay error, seguimos sin bloquear la vista
      console.warn('[modulo_detalle] No se pudo cargar Aprendidas:', (e as any)?.message);
    }
  }


  const toggle_visualizada = async (item: Senia_Aprendida)=>{
    setSelectedSenia(item);
    setModalVisible(true);
    //sumar visualización de la seña
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

  const toggleAprendida = async (info_senia: Senia_Aprendida, value: boolean) => {    
    if (value) {
      marcar_aprendida(info_senia.senia.id,contexto.user.id)
        .catch(reason =>{
          console.error(reason);
          error_alert("No se pudo actualizar el estado")
        })
        .then(async ()=>{
          success_alert('Marcada como aprendida' );
          info_senia.aprendida= value;
          setAprendidasMap((prev) => ({ ...prev, [info_senia.senia.id]: value }));
          setCantAprendidas((prev) => (prev+=1));  
          //si aprendiste todas, completar el módulo:
          if (!completado && todas_aprendidas()){
            try {
              setModalVisible(false);
              await completar_modulo_alumno(contexto.user.id,Number(id));
              //router.push({ pathname: '/tabs/Modulos_Alumno/lecciones/completado', params: { id: id } })
            } catch (error) {
              console.error(error);
              error_alert("No se pudo guardar tu progreso.");
            }
          }
          
        })
      ganar_insignia_senia(contexto.user.id);
    } else if (!completado) {
      marcar_no_aprendida(info_senia.senia.id,contexto.user.id)
        .catch(reason=>{
          console.error(reason);
          error_alert("No se pudo actualizar el estado");
        })
        .then(()=>{
          success_alert( 'Marcada como no aprendida');
          info_senia.aprendida= value;
          setCantAprendidas((prev) => (prev-=1));   
          setAprendidasMap((prev) => ({ ...prev, [info_senia.senia.id]: value }));
        })
    } else {
      alert("No puedes marcar como no aprendida una seña en un módulo completado");
    }  
  }

  const todas_aprendidas = ()=>{    
    let res = true;
    if (senias){
      senias.forEach(s=>{
        if (!s.aprendida) res = false
      })
    } else {
      res=false;
    }
    return res
  }
  
  const promedio_reseñas = ()=>{
    let promedio =0;
    calificaciones_modulo?.forEach(each=>{
      promedio+= each.puntaje;
    });
    return calificaciones_modulo? promedio / calificaciones_modulo.length : 0
  }
  
  const verificarCalificacion = async () => {
    try {
      const calificaciones = await calificacionesModulo(Number(id));
      const ya = calificaciones?.find((c: any) => c.id_alumno === contexto.user.id);
      setYaCalificado(!!ya);
      if (!ya && senias && senias.length > 0 && senias.every(s => s.aprendida)) {
        setShowCalificacionModal(true);
      }
    } catch (e) {
      // Si hay error, no bloquea la vista
      console.error(e);
    }
  };

  // Cuando cambian las señas aprendidas, verifica si debe mostrar el modal
  useEffect(() => {
    if (!yaCalificado && senias && senias.length > 0 && senias.every(s => s.aprendida)) {
      setShowCalificacionModal(true);
    } else {
      setShowCalificacionModal(false);
    }
  }, [senias, yaCalificado]);

  const enviarCalificacion = async () => {
    try {
      await calificarModulo(Number(id), contexto.user.id, puntaje, comentario);
      fetch_modulo();
      setShowCalificacionModal(false);
      setYaCalificado(true);
      success_alert("¡Gracias por tu calificación!");
    } catch (e) {
      error_alert("No se pudo guardar la calificación");
    }
  };

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
              onPress={() => {   contexto.user.gotToModules()   }}
            >
        <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
        <Text style={styles.backBtnText}>Volver</Text>
      </Pressable>
      <Text style={styles.title}> {modulo?.nombre}</Text>

      <TouchableOpacity style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, elevation: 2 }} onPress={()=>setModalCalificaciones(true)}>
        {calificaciones_modulo && calificaciones_modulo.length>0 ? 
        <>
          <ThemedText>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Calificación:</ThemedText> {' '}
            <ThemedText type="defaultSemiBold">{promedio_reseñas().toFixed(2)}</ThemedText>
          </ThemedText>
          
          <ThemedText>
            <ThemedText>{calificaciones_modulo.length}</ThemedText>{' '}
            <ThemedText>{calificaciones_modulo.length == 1 ? "calificación" : "calificaciones"} </ThemedText>
          </ThemedText>
          </>
          : <>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Calificación:</Text>
          <ThemedText lightColor="gray">Este módulo aún no tiene calificaciones</ThemedText>
          </>
        }
      </TouchableOpacity>  

      <Pressable onPress={()=>router.push({ pathname: '/tabs/Modulos_Alumno/lecciones', params: { id: modulo?.id } })} 
        style={styles.ctaButtonCursos}>
        <Ionicons name="flash" size={24} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.ctaButtonTextCursos}>Empezar lección</Text>
      </Pressable>    
      
      <FlatList      
        data={senias ? senias : []}
        keyExtractor={(item) => item.senia.id.toString()}
        ListFooterComponent={<View style={{marginVertical:28}}></View>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flexDirection:"row", alignContent: "space-around", justifyContent:"space-between"}}>
              <Text style={styles.cardTitle}>{item.senia.significado}</Text>
              {item.aprendida  && <Ionicons name="checkmark-circle" color={paleta.strong_yellow} size={25}  />}
            </View>
           
            <Pressable
              style={[styles.button]}
              onPress={() => { toggle_visualizada(item)}}
            >
              <Text style={styles.buttonText}>Ver seña</Text>
            </Pressable>
            
          </View>
        )}
      />      

        <SmallPopupModal title={selectedSenia?.senia.significado} modalVisible={modalVisible} setVisible={setModalVisible}>
          {selectedSenia && (
            <VideoPlayer 
              uri={selectedSenia.senia.video_url}
              style={styles.video}
            />
          )}
          {selectedSenia && selectedSenia.senia.Categorias ?
          <ThemedText style={{margin:10}}>
            <ThemedText type='defaultSemiBold'>Categoría:</ThemedText> {''}
            <ThemedText>{selectedSenia.senia.Categorias.nombre}</ThemedText>
          </ThemedText>
            :null
          }
          
          {selectedSenia && selectedSenia.senia.Users  ?
          <ThemedText style={{margin:10}}>
            <ThemedText type='defaultSemiBold'>Autor:</ThemedText> {''}
            <ThemedText>{selectedSenia.senia.Users.username} </ThemedText> {''}
          </ThemedText>
            :null
          }

          {selectedSenia && selectedSenia.descripcion && selectedSenia.descripcion!=""  ?
          <ThemedText style={{margin:10}}>
            <ThemedText type='defaultSemiBold'>Descripción:</ThemedText> {''}
            <ThemedText>{selectedSenia.descripcion} </ThemedText> {''}
          </ThemedText>
            :null
          }

          {/* Toggle Aprendida */}
          {selectedSenia && (
            <View style={styles.row}>
              <Checkbox
                value={selectedSenia.aprendida}
                onValueChange={(v) => toggleAprendida(selectedSenia, v)}
                color={selectedSenia.aprendida ? '#20bfa9' : undefined}
                style={styles.checkbox}
              />
              <Text style={styles.checkboxLabel}>Aprendida</Text>
            </View>
          )}
        </SmallPopupModal>
          

        {/* Modal para calificación */}
        <Modal
          visible={showCalificacionModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Califica este módulo</Text>
              {/* Estrellas para puntaje */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                {[...Array(5)].map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setPuntaje(i + 1)}>
                    <AntDesign
                      name={puntaje > i ? "star" : "star"}
                      size={32}
                      color={puntaje > i ? "#FFD700" : "#E0E0E0"}
                      style={{ marginHorizontal: 2 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{textAlign:'center', marginBottom:10}}>Puntaje: {puntaje} estrellas</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Comentario (opcional)"
                value={comentario}
                onChangeText={setComentario}

              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.button} onPress={enviarCalificacion} disabled={puntaje === 0}>
                  <Text style={styles.buttonText}>Enviar calificación</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={() => setShowCalificacionModal(false)}>
                  <Text style={styles.buttonText}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

                <SmallPopupModal title={"Reseñas "} modalVisible={modalCalificaciones}  setVisible={setModalCalificaciones}>
            {calificaciones_modulo && calificaciones_modulo.length>0 ?
            <View>

              <FlatList
              style={[{maxHeight:500}]}
                keyExtractor={(item)=>item.id.toString()}
                data={calificaciones_modulo}
                renderItem={({ item }) => (
                  <View style={[styles.card,estilos.shadow, {marginBottom:5,marginHorizontal:5}]}>
                    <RatingStars color={paleta.strong_yellow} puntaje={item.puntaje} />
                    <ThemedText>
                      <ThemedText lightColor="gray">{get_antiguedad(item.created_at)}</ThemedText>{' - '}
                      <ThemedText lightColor="gray">{item.Users? item.Users.username: "Anónimo"}</ThemedText>
                      {item.Users && item.Users.id==contexto.user.id ? 
                        <ThemedText lightColor="gray">  (Yo)</ThemedText>:null
                      }
                    </ThemedText>
                    <ThemedText style={{marginVertical: 10}} lightColor="#404243ff">{item.comentario ? item.comentario : null}</ThemedText>
                  </View> 
                )}
              />
            </View> 
            :
            <ThemedText lightColor="gray">Este módulo aún no tiene calificaciones</ThemedText>
            }
        </SmallPopupModal>
        <Toast/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6f7f2",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    marginTop:20,
    color: "#222",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
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
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
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
  ctaButtonCursos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paleta.dark_aqua,
    borderRadius: 14,
    height: 50,
    marginVertical: 20,
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
   buttonIcon: {
    marginRight: 8,
  },
});
