import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {  useFocusEffect } from 'expo-router';
import { useUserContext } from '@/hooks/useUserContext';
import { Senia_Info } from '@/components/types';
import { error_alert, success_alert } from '@/components/alert';
import { paleta } from '@/components/colores';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { estilos } from '@/components/estilos';
import { eliminarReporte, todosReportes } from '@/conexiones/reportes';
import { SmallPopupModal } from '@/components/modals';
import VideoPlayer from '@/components/VideoPlayer';


type Reporte = {
    Motivos_reporte: {descripcion: string};
    comentario: string;
    id: number;
    id_profe: number;
    id_senia:number
    Senias: Senia_Info
}

export default function Moderacion() {
    const [reportes, setReportes] = useState<Reporte[]>();
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState<number | null>(null);
    const [reporteSeleccionado, setReporteSeleccionado] =useState<Reporte>();
    const [modalVisible,setModalVisible] =useState(false)
    const contexto = useUserContext();

    useFocusEffect(
        useCallback(() => {
          fetchReportes();
          return () => {
          };
        }, [])
    );

    const fetchReportes = async () => {
        setLoading(true)
        try {
            const r = await todosReportes();            
            setReportes(r || [])
        } catch (error) {            
            error_alert("No se pudo cargar los reportes");
            console.error(error)
        } finally{
            setLoading(false);
        }        
    }

    const handleDelete = async (id: number) => {
        setShowMenu(null);    
    //borrar reporte
        eliminarReporte(id)
        .then(()=>{
            setModalVisible(false);
            success_alert("¡Reporte eliminado con éxito!");
            fetchReportes();
        })
        .catch(reason=>{
            error_alert("No se pudo eliminar el reporte");
            console.error(reason)
        })
    };
    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={paleta.dark_aqua} />
        </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.modalHeader}>
                <Text style={styles.title}>Señas reportadas</Text>
            </View>

            <FlatList
                data={reportes}
                keyExtractor={item=>item.id.toString()}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={<ThemedText style={estilos.centrado} lightColor='gray'>No hay reseñas ni reportes</ThemedText>}
                renderItem={({ item }: { item: Reporte }) =>{
                    return (
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                
                                <View>
                                <Text style={styles.cardTitle}>{item.Senias.significado}</Text>
                                <Text style={styles.cardSubtitle}>{item.Motivos_reporte.descripcion || ''}</Text>
                                </View>
                            </View>
                            <Pressable onPress={() => setShowMenu(showMenu === item.id ? null : item.id)} style={{ padding: 8 }}>
                                <Ionicons name="ellipsis-vertical" size={22} color="#888" />
                            </Pressable>
                            </View>
                            <View style={styles.cardActions}>
                            <Pressable
                                style={styles.viewBtn}
                                onPress={() => {setModalVisible(true);setReporteSeleccionado(item)}}
                            >
                                <Text style={styles.viewBtnText}>Ver detalles</Text>
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
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Ionicons name="trash" size={18} color="#e74c3c" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>Eliminar reporte</Text>
                                </Pressable>
                                </View>
                            </>
                            )}
                        </View>
                                  
                    )
                }}
            />

            <SmallPopupModal title={reporteSeleccionado?.Senias.significado} modalVisible={modalVisible} setVisible={setModalVisible } >
                <View>
                    {reporteSeleccionado && (
                        <>
                        <VideoPlayer 
                        uri={reporteSeleccionado.Senias.video_url}
                        style={styles.video}
                        />
                        <ThemedText style={{margin:10}}>
                        <ThemedText type='defaultSemiBold'>Categoría:</ThemedText> {''}
                        <ThemedText>{reporteSeleccionado.Senias.Categorias.nombre}</ThemedText>
                        </ThemedText>   

                        <ThemedText style={styles.cardTitle}>{reporteSeleccionado.Motivos_reporte.descripcion}</ThemedText>
                        <ThemedText style={styles.cardSubtitle}>{reporteSeleccionado.comentario}</ThemedText>

                        <TouchableOpacity style={[styles.iconButton,estilos.shadow,{backgroundColor:"red"}]} onPress={()=>{handleDelete(reporteSeleccionado.id)}}   >  
                        <Ionicons name="trash-bin-outline" color='white' size={25} style={styles.icon} />
                        <ThemedText type="subtitle" lightColor='white' style={{flex:2}}>Eliminar reporte</ThemedText>
                        </TouchableOpacity>
                        </>
                    )}

                    
                </View>
                
            </SmallPopupModal>
            <Toast/>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7f2',
    position: 'relative',
    paddingTop: 0,
  },
  
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: paleta.dark_aqua,
    marginTop: 50,
    marginBottom: 40,
    alignSelf: 'center',
    zIndex: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#20bfa9',
    fontWeight: '500',
    marginBottom: 18,
    alignSelf: 'center',
    zIndex: 2,
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  separator: {
    height: 5,
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
    marginVertical: 10,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f7f2",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: "#20bfa9",
    fontWeight: "bold",
    marginLeft: 4,
  },
  viewBtn: {
    backgroundColor: "#20bfa9",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  video: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    zIndex: 2,
  },
});
