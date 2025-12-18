import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Modal, ScrollView, TextInput, Touchable, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {  Modulo } from "@/components/types";
import {  mis_modulos_completos,  } from "@/conexiones/modulos";
import { calificacionesModulo } from "@/conexiones/calificaciones";
import Toast from "react-native-toast-message";
import { modulosCalificados, promedio_reseñas } from "@/conexiones/calificaciones";
import { ThemedText } from "@/components/ThemedText";
import { useUserContext } from "@/context/UserContext";
import { AntDesignStars } from "@/components/review";
import { paleta } from "@/components/colores";
import { error_alert } from "@/components/alert";

interface ModuloCalificado extends Modulo {
  promedio: number;
  completado: boolean
}

export default function ModulosScreen() {
  const router = useRouter();

  const [modulos,setModulos] = useState<ModuloCalificado[]>([]);
  const [filteredModulos, setFilteredModulos] = useState<ModuloCalificado[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [calificacionesPorModulo, setCalificacionesPorModulo] = useState<Record<number, any[]>>({});
  const [comentariosModalVisible, setComentariosModalVisible] = useState(false);
  const [comentariosSeleccionados, setComentariosSeleccionados] = useState<any[]>([]);  
  const [mostrar_completados,setMostrarCompletados] = useState(false);
  const [mostrar_no_completados,setMostrarNoCompletados] = useState(false);
  const [populares,setPopulares]= useState(false);
  const [loading,setLoading] = useState(false);

  const contexto = useUserContext();

  useFocusEffect(
      useCallback(() => {
        
        fetch_modulos();        
        setMostrarCompletados(false);
        setPopulares(false);
        setMostrarNoCompletados(false);
        return () => {};
      }, [])
  );

  useEffect(() => {
      filterModulosBusqueda();
    }, [searchQuery, modulos]);

  const fetch_modulos = async ()=>{
    try {
      setLoading(true);
      const m2 = await modulosCalificados();
      const completados = await mis_modulos_completos(contexto.user.id);

      const lo_complete = (id_modulo:number)=>{
        let res = false;
        completados.forEach(m=>{
          if (m.id_modulo==id_modulo) res=true
        });
        return res
      }
    
      const res =m2?.map( e=>{        
        let prom = promedio_reseñas(e.Calificaciones_Modulos);
        fetchCalificaciones(e.id)
        let completo = lo_complete(e.id);      
        return {id: e.id, descripcion: e.descripcion,icon:e.icon,nombre:e.nombre,promedio:prom, autor:e.autor, completado:completo}
      });
      if (res ){
        const ordenados = ordenarModulosAlfabetico(res);
        setModulos(ordenados || []);
        setFilteredModulos(ordenados || []);
      }
    } catch (error) {
      console.error(error);
      error_alert('No se pudieron cargar los módulos');
    } finally{
      setLoading(false)
    }       
  }

  const fetchCalificaciones = async (id_modulo: number) => {
    try {
      const calificaciones = await calificacionesModulo(id_modulo) || [];
      setCalificacionesPorModulo(prev => ({ ...prev, [id_modulo]: calificaciones }));
      
    } catch (e) {
      console.error(e);
    }
  };

  const ordenarModulosAlfabetico = (m : ModuloCalificado[])=>{
    const ordered = m.sort(function (a, b) {
      if (a.nombre < b.nombre) {
        return -1;
      }
      if (a.nombre > b.nombre) {
        return 1;
      }
      return 0;
    })
    return ordered
  }
  const ordenarModulosCalificacion = ()=>{
    setLoading(true);
    if (populares){
      setPopulares(false);
      setFilteredModulos(ordenarModulosAlfabetico(filteredModulos));
    } else{
      setPopulares(true);
      const ordered = filteredModulos.sort(function (a, b) {
        if (a.promedio < b.promedio) {
          return 1;
        }
        if (a.promedio > b.promedio) {
          return -1;
        }
        return 0;
      })
      setFilteredModulos(ordered);       
    }    
    setLoading(false);
  }

  const filterModulosBusqueda = () => {
    var filtered = modulos.filter(m => 
      m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) 
    );        
    setFilteredModulos(filtered);  
    return filtered  
  };

  const filterCompletados = ()=>{
    setLoading(true);
    setPopulares(false);
    if (mostrar_completados) {
      setMostrarCompletados(false);
      filterModulosBusqueda();
    } else{
      setMostrarCompletados(true);
      setMostrarNoCompletados(false);
      let aux=filterModulosBusqueda();
      const filtered = aux.filter(m=> m.completado);    
      setFilteredModulos(filtered);   
    }    
    setLoading(false);   
  }
  const filterNoCompletados = ()=>{    
    setLoading(true);
    setPopulares(false);
    if (mostrar_no_completados) {
      setMostrarNoCompletados(false);
      filterModulosBusqueda();
    } else {
      setMostrarCompletados(false);
      setMostrarNoCompletados(true);
      let aux=filterModulosBusqueda();
      const filtered = aux.filter(m=> !m.completado);    
      setFilteredModulos(filtered); 
    }       
    setLoading(false);       
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis módulos</Text>

      <View style={styles.searchBarRowCursos}>
        <Ionicons name="search" size={22} color="#20bfa9" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInputCursos}
          placeholder="Buscar módulo..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#20bfa980"
        />
        <Text style={styles.countTextCursos}>{filteredModulos.length}</Text>
      </View>
      <View style={{flexDirection:"row"}}>
        <TouchableOpacity style={[styles.filtros,
        mostrar_completados ? {backgroundColor: paleta.dark_aqua}: {backgroundColor: paleta.aqua}]} 
          onPress={filterCompletados}>
          <ThemedText lightColor={mostrar_completados ? "white":"black"} type="defaultSemiBold">Completados</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filtros,{backgroundColor: mostrar_no_completados ? paleta.dark_aqua:paleta.aqua}]} 
          onPress={filterNoCompletados}>
          <ThemedText lightColor={mostrar_no_completados ? "white":"black"} type="defaultSemiBold">No completados</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filtros,{backgroundColor: populares ? paleta.dark_aqua:paleta.aqua}]} 
          onPress={ordenarModulosCalificacion}>
          <ThemedText type="defaultSemiBold" lightColor={populares ? "white":"black"}>Populares</ThemedText>
        </TouchableOpacity>
      </View>
      {loading ?
      (<View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={paleta.dark_aqua} />
        </View>): (
      <FlatList
        data={filteredModulos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{paddingBottom:80}}

        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignContent:"center"}}>
              <Ionicons name={item.icon} size={36} color="#20bfa9" />
              {item.completado &&  (<ThemedText>🎉 ¡Completado!</ThemedText>)}
            </View>
            
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.cardSubtitle}>  {item.descripcion}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between" }}>
              {/* { Promedio de estrellas } */}
              <View>
                {item.promedio!=0 && (<AntDesignStars puntaje={item.promedio} color={paleta.soft_yellow}/>)}
                <ThemedText lightColor="gray">
                <ThemedText type="defaultSemiBold" lightColor="gray">Calificación: </ThemedText>
                {item.promedio==0 ? <ThemedText>-</ThemedText> : <ThemedText>{item.promedio.toFixed(2)} / 5</ThemedText> }                
              </ThemedText>
              </View>
              
              {/* { Botón para ver comentarios } */}
              {item.promedio!=0 && (<Pressable
                style={{ padding: 8, backgroundColor: paleta.strong_yellow, borderRadius: 8 }}
                onPress={async () => {
                  if (!calificacionesPorModulo[item.id]) {
                    await fetchCalificaciones(item.id);
                  }
                  setComentariosSeleccionados((calificacionesPorModulo[item.id] || []).filter(c => c.comentario));
                  setComentariosModalVisible(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Ver comentarios</Text>
              </Pressable>)}
              </View>
            <View>
                            
              
                
            </View>
            <Pressable
              style={styles.button}
              onPress={() => router.push({ pathname: '/tabs/Modulos_Alumno/modulo_detalle', params: { id: item.id } })}
            >
              <Text style={styles.buttonText}>Ver módulo</Text>
            </Pressable>
          </View>
        )}
      />
        )
    }
      
      <Modal
        visible={comentariosModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setComentariosModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comentarios del módulo</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {comentariosSeleccionados.length === 0 ? (
                <Text>No hay comentarios.</Text>
              ) : (
                comentariosSeleccionados.map((c, idx) => (
                  <View key={idx} style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: "bold", color: "#20bfa9" }}>{c.Users?.username || "Alumno"}</Text>
                    <Text>{c.comentario}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <Pressable style={styles.button} onPress={() => setComentariosModalVisible(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop:60,
    color: "#222",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#222",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    color: "#222",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },
  cardSubtitle: {
    color: "#555",
    fontSize: 15,
    marginBottom: 12,
    marginTop:10
  },
  button: {
    backgroundColor: "#20bfa9",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    paddingHorizontal: 5,

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
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#222",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#222",
  },
  searchBarRowCursos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 18,
    marginBottom: 18,
    paddingHorizontal: 18,
    zIndex: 2,
    shadowColor: '#20bfa9',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#20bfa9',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputCursos: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#20bfa9',
    backgroundColor: 'transparent',
    fontWeight: 'bold',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  countTextCursos: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
    backgroundColor: '#e6f7f2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontFamily: 'System',
  },
  filtros: {
    padding: 8,
    borderRadius: 12,        
    margin: 5,
    marginBottom: 15
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
  },
});
