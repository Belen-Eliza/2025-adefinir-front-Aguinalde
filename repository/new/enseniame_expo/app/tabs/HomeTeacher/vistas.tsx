import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable,  FlatList, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useUserContext } from '@/hooks/useUserContext';
import {  Senia_Info } from '@/components/types';
import { mis_senias } from '@/conexiones/videos';
import { error_alert } from '@/components/alert';
import { paleta, paleta_colores } from '@/components/colores';
import { visualizaciones_profe } from '@/conexiones/visualizaciones';
import { SmallPopupModal } from '@/components/modals';
import { ThemedText } from '@/components/ThemedText';
import VideoPlayer from '@/components/VideoPlayer';
import { estilos } from '@/components/estilos';
import Toast from 'react-native-toast-message';

type Senias_Vistas ={
    senia: Senia_Info,
    vistas: number
}

export default function Vistas (){
    const [senias, setSenias] = useState<Senias_Vistas[]>([]);
    const [filteredSenias, setFilteredSenias] = useState<Senias_Vistas[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [selectedSenia, setSelectedSenia] = useState<Senias_Vistas | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const contexto = useUserContext();

    useFocusEffect(
        useCallback(() => {
          fetchVistas();
          return () => {
          };
        }, [])
    );

    useEffect(() => {
        filterSenias();
      }, [searchQuery, senias]);

    const fetchVistas = async ()=>{
        try {
            const vistas = await visualizaciones_profe(contexto.user.id);

            const data = await mis_senias(contexto.user.id);

            const cantidad_vistas = (id_senia: number)=>{
              let max = 0;
              vistas?.forEach(each=>{
                  if (each.senia==id_senia) max++
              });
              return max
            }
            
            const data_vistas = data?.map(each=>{
              let vistas = cantidad_vistas(each.id);
              return {senia:each,vistas:vistas}
            })
            setSenias(data_vistas || []);
            setFilteredSenias(data_vistas || []);

            setLoading(false);
        } catch (error) {
            error_alert("Error al buscar las estadísticas");
            console.error(error);
        }
    }

    const filterSenias = () => {
        var filtered = senias.filter(senia => 
        senia.senia.significado.toLowerCase().includes(searchQuery.toLowerCase()) ||
        senia.senia.Categorias.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) 
        );
        
        //ordenar por más vistas
        const orderedAndFiltered =filtered.sort(function (a, b) {
            return b.vistas-a.vistas;
        })
        setFilteredSenias(orderedAndFiltered);
        
    };

    

    const renderSenia = ({ item }: { item: Senias_Vistas }) => (
        <Pressable 
          style={styles.listItem}
          onPress={async () => {
            setSelectedSenia(item);
            setModalVisible(true);
            }
          }
        >
          <View style={styles.listItemContent}>
            <View>
              <Text style={styles.significadoText}>{item.senia.significado}</Text>
              <Text style={[styles.significadoText,{fontSize:12,marginTop:5, color: paleta.strong_yellow}]}>{item.vistas} {item.vistas==1 ? "vista": "vistas"}</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={24} color={paleta.dark_aqua} />
          </View>
        </Pressable>
      );

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
                <Text style={styles.title}>Mis videos</Text>
            </View>
            <View style={styles.searchBarRowCursos}>
            <Ionicons name="search" size={22} color="#20bfa9" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInputCursos}
                placeholder="Buscar seña..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#20bfa980"
            />
            <Text style={styles.countTextCursos}>{filteredSenias.length}</Text>
            </View>
            <FlatList
                data={filteredSenias}
                renderItem={renderSenia}
                keyExtractor={(item) => item.senia.id.toString()}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={<ThemedText style={estilos.centrado} lightColor='gray'>Aún no subiste ninguna seña</ThemedText>}
            />
            
        <SmallPopupModal title={selectedSenia?.senia.significado} modalVisible={modalVisible} setVisible={setModalVisible}>
          {selectedSenia && (
            <>
            <VideoPlayer 
              uri={selectedSenia.senia.video_url}
              style={styles.video}
            />
            <ThemedText style={{margin:10}}>
                <ThemedText type='defaultSemiBold'>Categoría:</ThemedText> {''}
                <ThemedText>{selectedSenia.senia.Categorias.nombre}</ThemedText>
            </ThemedText>

            <ThemedText style={[{margin:10}]}>
                <ThemedText type='defaultSemiBold' style={{fontSize:20}}>Vistas:</ThemedText> {''}
                <ThemedText style={{fontSize:20}}>{selectedSenia.vistas}</ThemedText>
            </ThemedText>

            </>
          )}

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
  
  
   modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    zIndex: 2,
  },
  separator: {
    height: 10,
  },
  significadoText: {
    fontSize: 17,
    color: '#222',
    fontWeight: 'bold',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  listItem: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 32,
    marginBottom: 14,
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
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
  video: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 12,
  },
})