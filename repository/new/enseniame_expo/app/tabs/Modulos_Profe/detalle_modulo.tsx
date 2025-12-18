import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput, Alert, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../utils/supabase";
import { useUserContext } from "@/context/UserContext";
import { ThemedText } from "@/components/ThemedText";
import VideoPlayer from "@/components/VideoPlayer";
import { Senia_Info } from "@/components/types";
import { paleta } from "@/components/colores";
import { buscar_senias_modulo, sumar_descripcion_senia_modulo } from "@/conexiones/modulos";
import Toast from "react-native-toast-message";
import { SmallPopupModal } from "@/components/modals";
import { calificacionesModulo } from "@/conexiones/calificaciones";
import { estilos } from "@/components/estilos";
import { get_antiguedad } from "@/components/validaciones";
import { nombre_usuario } from "@/conexiones/gestion_usuarios";
import { RatingStars } from "@/components/review";
import { error_alert, success_alert } from "@/components/alert";
import { BotonLogin } from "@/components/botones";

interface Senia {
  id: number;
  significado: string;
  video_url: string;
  thumbnail?: string;
}
type Calificaciones = {
  id_alumno: number;
  Users?: {username:string};
  id_modulo: number;
  puntaje: number;
  comentario? : string;
  created_at: string;
  id:number;
}

interface Senia_Modulo {
  Senias: Senia_Info;
  descripcion?: string
}

export default function DetalleModuloScreen() {
  const { id, nombre } = useLocalSearchParams<{ id: string, nombre?: string }>();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [seniasModulo, setSeniasModulo] = useState<Senia_Modulo[]>([]);
  const [calificaciones_modulo,setCalificacionesModulo] = useState<Calificaciones[]>()
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diccionario, setDiccionario] = useState<Senia[]>([]);
  const [agregando, setAgregando] = useState(false);

  const [selectedSenia, setSelectedSenia] = useState<Senia_Modulo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [modalCalificaciones,setModalCalificaciones] = useState(false);

  const [showDescripcionModal, setShowDescripcionModal] = useState(false);
  const [descripcion_senia, setDescripcion] = useState("");

  const contexto = useUserContext();

  useEffect(() => {
    fetchSeniasModulo();
    fetchDiccionario();
  }, [id]);

  const fetchDiccionario = async () => {
    const { data, error } = await supabase.from('Senias').select('*').order('significado', { ascending: true });
    if (!error && data) setDiccionario(data);
  };

  const fetchSeniasModulo = async () => {
    setLoading(true);
    try {
      const s = await  buscar_senias_modulo(Number(id));   
      setSeniasModulo(s || []);
      const calificaciones =await calificacionesModulo(Number(id));
      setCalificacionesModulo(calificaciones || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar las señas del módulo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEliminarSenia = async (seniaId: number) => {
    Alert.alert(
      'Eliminar seña',
      '¿Estás seguro de que quieres eliminar esta seña del módulo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            const { error } = await supabase
              .from('Modulo_Video')
              .delete()
              .eq('id_modulo', id)
              .eq('id_video', seniaId);
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar la seña');
            } else {
              setSeniasModulo(seniasModulo.filter(s => s.Senias.id !== seniaId));
              fetchSeniasModulo();
              Alert.alert('Seña eliminada', 'La seña fue eliminada del módulo correctamente.');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSeniasModulo();
  };

  const handleVerSenia = (senia: Senia_Modulo) => {
    setSelectedSenia(senia);
    setModalVisible(true)
  };

  const handleAgregarSenia = async (senia: Senia) => {
    setAgregando(true);
    const { error } = await supabase
      .from('Modulo_Video')
      .insert([{ id_modulo: id, id_video: senia.id }]);
    setAgregando(false);
    if (error) {
      Alert.alert('Error', 'No se pudo agregar la seña');
    } else {
      setSearch("");
      fetchSeniasModulo();
      Alert.alert('Seña agregada', 'La seña fue agregada al módulo correctamente.');
    }
  };

  const confirmar_descripcion = async () => {
    try {
      if (selectedSenia) {
        await sumar_descripcion_senia_modulo(Number(id),selectedSenia?.Senias.id,descripcion_senia);
        success_alert("La descripción se agregó exitosamente");
        fetchSeniasModulo();
        setShowDescripcionModal(false);
        setDescripcion("");
      }
      
    } catch (error) {
      error_alert("No se pudo guardar la descripcion");
      console.error(error)
    }
  }

  const agregar_descripcion = ()=>{
    setModalVisible(false)
    setShowDescripcionModal(true);
  
  }

  const filteredDiccionario = diccionario.filter(
    s =>
      s.significado.toLowerCase().includes(search.toLowerCase()) &&
      !seniasModulo.some(sm => sm.Senias.id === s.id)
  );

  const promedio_reseñas = ()=>{
    let promedio =0;
    calificaciones_modulo?.forEach(each=>{
      promedio+= each.puntaje;
    });
    return calificaciones_modulo? promedio / calificaciones_modulo.length : 0
  }
  const get_nombre_autor = async (uid:number) => {
    let res = "";
    try {
      res = await nombre_usuario(uid);
    } catch (error) {
      console.error(error)
    } finally {
      return res
    }
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
      <Text style={styles.title}>Módulo: {nombre ? nombre : ''}</Text>

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

      {/* Barra de búsqueda fija */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Buscar seña en el diccionario</Text>
        <TextInput
          placeholder="Buscar palabra..."
          style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 8, marginBottom: 10 }}
          value={search}
          onChangeText={setSearch}
        />
        {agregando && <ActivityIndicator size="small" color="#20bfa9" style={{ marginBottom: 8 }} />}
        {search.length > 0 && filteredDiccionario.length > 0 && (
          filteredDiccionario.map((senia) => (
            <Pressable
              key={senia.id}
              style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}
              onPress={() => handleAgregarSenia(senia)}
            >
              <Text style={{ color: '#222', fontSize: 16 }}>{senia.significado}</Text>
            </Pressable>
          ))
        )}
        {search.length > 0 && filteredDiccionario.length === 0 && (
          <Text style={{ color: '#888', fontStyle: 'italic' }}>No se encontraron coincidencias.</Text>
        )}
      </View>
      
      {/* Lista de señas agregadas al módulo */}
      {loading ? (
        <ActivityIndicator size="large" color="#20bfa9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={seniasModulo}
          keyExtractor={(item) => item.Senias.id.toString()}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Image source={{ uri: /* item.thumbnail || */ 'https://img.youtube.com/vi/1/default.jpg' }} style={styles.thumbnail} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.Senias.significado}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      style={styles.viewBtn}
                      onPress={() => handleVerSenia(item)}
                    >
                      <Text style={styles.viewBtnText}>Ver seña</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.viewBtn, { backgroundColor: '#e74c3c' }]}
                      onPress={() => handleEliminarSenia(item.Senias.id)}
                    >
                      <Ionicons name="trash" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
      {/* Botón Guardar */}
      <Pressable
        style={{ backgroundColor: '#20bfa9', borderRadius: 30, alignSelf: 'center', marginTop: 24, paddingVertical: 14, paddingHorizontal: 40 }}
        onPress={() => router.back()}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Guardar</Text>
      </Pressable>

      {/* Modal para descripcion */}
        <Modal
          visible={showDescripcionModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Añade una descripción para la seña "{selectedSenia?.Senias.significado}"</Text>                                       
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Comentario (opcional)"
                value={descripcion_senia}
                onChangeText={setDescripcion}
                multiline
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.button} onPress={confirmar_descripcion} disabled={descripcion_senia === ""}>
                  <Text style={styles.buttonText}>Confirmar</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={() => setShowDescripcionModal(false)}>
                  <Text style={styles.buttonText}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <SmallPopupModal title={selectedSenia?.Senias.significado} modalVisible={modalVisible} setVisible={setModalVisible}>
          {selectedSenia && (
            <VideoPlayer 
              uri={selectedSenia.Senias.video_url}
              style={styles.video}
            />
          )}
          {selectedSenia ?
          <ThemedText style={{margin:10}}>
            <ThemedText type='defaultSemiBold'>Categoría:</ThemedText> {''}
            <ThemedText>{selectedSenia.Senias.Categorias.nombre}</ThemedText>
          </ThemedText>
            :null
          }
              
          {selectedSenia && selectedSenia.Senias.Users  ?
          <ThemedText style={{margin:10}}>
            <ThemedText type='defaultSemiBold'>Autor:</ThemedText> {''}
            <ThemedText>{selectedSenia.Senias.Users.username} </ThemedText> {''}
          </ThemedText>
            :null
          }

          {selectedSenia ?
          <View >
          <ThemedText style={{margin:10}}>
            <ThemedText type='defaultSemiBold'>Descripción:</ThemedText> {''}
            <ThemedText>{selectedSenia.descripcion? selectedSenia.descripcion : "  -  "}</ThemedText>
          </ThemedText>

          <BotonLogin callback={()=>agregar_descripcion()} textColor={"black"} bckColor={paleta.aqua} text={"Editar descripción"}  />
            
          </View>
            :null
          }

        </SmallPopupModal>

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
                      </ThemedText>
                      <ThemedText style={{marginTop: 10}} lightColor="#404243ff">{item.comentario ? item.comentario : null}</ThemedText>
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
    backgroundColor: '#e6f7f2',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    alignSelf: 'center',
    textAlign:"center",
    marginBottom: 18,
    marginTop:15
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: '#e0e0e0',
  },
  cardTitle: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  viewBtn: {
    backgroundColor: '#20bfa9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  viewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
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
 
  video: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
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
    color: "#10bdef"
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
});
