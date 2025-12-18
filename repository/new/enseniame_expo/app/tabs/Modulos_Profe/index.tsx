import React, { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { eliminar_modulo,  mis_modulos_calificados } from "@/conexiones/modulos";
import { useUserContext } from "@/context/UserContext";
import { error_alert } from "@/components/alert";
import Toast from "react-native-toast-message";
import { ThemedText } from "@/components/ThemedText";
import { Modulo } from "@/components/types";
import { promedio_reseñas } from "@/conexiones/calificaciones";
import { paleta } from "@/components/colores";

interface ModuloCalificado extends Modulo {
  promedio: number
}

export default function MisModulosScreen() {
  const [modules, setModules] = useState<ModuloCalificado[]>([]);
  const [filteredModulos, setFilteredModulos] = useState<ModuloCalificado[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const router = useRouter();

  const contexto = useUserContext()

  useFocusEffect(
    React.useCallback(() => {
      fetchModules();
    }, [])
  );
  useEffect(() => {
    filterModulosBusqueda();
  }, [searchQuery, modules]);

  const fetchModules = async () => {
    setLoading(true);
    try {      
      const data2 = await mis_modulos_calificados(contexto.user.id);         

      const res =data2?.map(e=>{        
        let prom = promedio_reseñas(e.Calificaciones_Modulos)        
        return {id: e.id, descripcion: e.descripcion,icon:e.icon,nombre:e.nombre,promedio:prom, autor:e.autor}
      });
        
      setModules(res || []);
      setFilteredModulos(res || [])
            
    } catch (error) {
      console.error(error);
      error_alert("Se produjo un error al buscar los módulos");
    }
    setLoading(false);
  };

  const filterModulosBusqueda = () => {
    var filtered = modules.filter(m => 
      m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) 
    );    
   const orderedAndFiltered =filtered.sort(function (a, b) {
      if (a.nombre < b.nombre) {
        return -1;
      }
      if (a.nombre > b.nombre) {
        return 1;
      }
      return 0;
    })
    setFilteredModulos(orderedAndFiltered);    
  };

  const handleDelete = async (id: number) => {
    setShowMenu(null);
    eliminar_modulo(id)
      .catch(reason=>{
        console.error(reason);
        error_alert("No se pudo eliminar el módulo");
      })
      .then(()=>fetchModules())
    
  };


  return (
    <View style={styles.container}>
  <Text style={styles.title}>Mis módulos</Text>
      <Pressable
        style={styles.addBtn}
        onPress={() => router.push("/tabs/Modulos_Profe/crear_modulo")}
      >
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.addBtnText}>Agregar módulo</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator size="large" color={paleta.sea_green} style={{ marginTop: 40 }} />
      ) : (
<>
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
        <FlatList
          data={filteredModulos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={item.icon || "cube-outline"} size={32} color={paleta.sea_green} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{item.descripcion || ''}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setShowMenu(showMenu === item.id ? null : item.id)} style={{ padding: 8 }}>
                  <Ionicons name="ellipsis-vertical" size={22} color="#888" />
                </Pressable>
              </View>
              <View>
                <ThemedText lightColor="gray">
                  <ThemedText type="defaultSemiBold" lightColor="gray">Calificación: </ThemedText>
                  {item.promedio==0 ? <ThemedText>-</ThemedText> : <ThemedText>{item.promedio.toFixed(2)} / 5</ThemedText> }
                  
                </ThemedText>
                  
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => router.push({
                    pathname: "/tabs/Modulos_Profe/detalle_modulo",
                    params: { id: item.id, nombre: String(item.nombre) }
                  })}
                >
                  <Text style={styles.viewBtnText}>Ver señas</Text>
                </Pressable>
              </View>
              {showMenu === item.id && (
                <>
                  <Pressable
                    style={{
                      position: 'absolute',
                      top: -1000,
                      left: -1000,
                      right: -1000, 
                      bottom: -1000,
                      zIndex: 98
                    }}
                    onPress={() => setShowMenu(null)}
                  />
                  {/* Menú flotante */}
                  <View style={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12, 
                    backgroundColor: '#fff', 
                    borderRadius: 10, 
                    elevation: 6, 
                    shadowColor: '#222', 
                    shadowOpacity: 0.15, 
                    zIndex: 100 
                  }}>
                    <Pressable
                      style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => {
                        setShowMenu(null);
                        router.push({ pathname: "/tabs/Modulos_Profe/crear_modulo", params: { id: item.id, nombre: String(item.nombre), icon: item.icon, descripcion: String(item.descripcion) } });
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color="#20bfa9" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#20bfa9', fontWeight: 'bold' }}>Editar módulo</Text>
                    </Pressable>
                    <Pressable
                      style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons name="trash" size={18} color="#e74c3c" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>Eliminar módulo</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}
        /></>
      )}
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: paleta.sea_green,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 18,
    marginTop: 8,
    shadowColor: '#222',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 20
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,    
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    alignSelf: "center",
    marginBottom: 18,
    marginTop: 50
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
    marginTop: 8,
  },
  cardSubtitle: {
    color: "#555",
    fontSize: 15,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  
  viewBtn: {
    backgroundColor: paleta.sea_green,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewBtnText: {
    color: "#fff",
    fontWeight: "bold",
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
});
