import React, { useState } from 'react';
import { View, StyleSheet,   TouchableOpacity, Pressable, ActivityIndicator, FlatList,Text } from 'react-native';
import {  Ionicons  } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { paleta, paleta_colores } from '@/components/colores';
import { estilos } from '@/components/estilos';
import { Image } from 'expo-image';
import {  insignias_por_categoria, todas_insignias, buscar_categoria, mis_insignias_ganadas, mis_insignias, cuantos_ganaron_insignia } from '@/conexiones/insignias';
import { SmallPopupModal } from '@/components/modals';

type Insignia = {
  id: number;
  nombre: string;
  descripcion: string;
  image_url: string;
  ganada: boolean
}
type I ={
  id: number;
  nombre: string;
  descripcion: string;
  image_url: string;
  ganada: boolean;
  cant_personas: number
}

type Motivo_Insignia = {
    id:number;
    motivo: string
}

export default function Categorias_Insignias () {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [categoria,setCategoria] = useState<Motivo_Insignia>();
    const [insignias,setInsignias] = useState<Insignia[]>();
    const [cant_ganadas,setCant] = useState(0);
    const [loading,setLoading] = useState(false);

    const [selected_insignia, setSelectedInsignia] = useState<I>();
    const [showModalI,setShowModalI] =useState(false);

    const contexto = useUserContext()

    useFocusEffect(
        React.useCallback(() => {
          fetchData();
        }, [])
    );

    const fetchData = async ()=>{
        try {
            setLoading(true);
            const i = await insignias_por_categoria(Number(id));
            const ganadas = await mis_insignias_ganadas(contexto.user.id);
            
            if (i && ganadas) {
              const res = i.map(each=>{
                  let g = false;
                  if (fue_ganada(ganadas,each)) {
                    g=true;
                    setCant(prev=>prev+1);
                  }
                  return {id:each.id,image_url:each.image_url,ganada:g,nombre:each.nombre,motivo:each.motivo,descripcion:each.descripcion}
                })
              setInsignias(res || []);
              
            }
            
            const c = await buscar_categoria(Number(id));
            if (c) setCategoria(c)
            setLoading(false);
        } catch (error) {
            console.error(error);
            error_alert("No se pudo cargar la información de las insignias");
        }
        
    }
   const fue_ganada = (ganadas:{id_insignia:number}[],i:Insignia)=>{
    return ganadas.find(each=>each.id_insignia==i.id) != undefined
  }
const renderInsignia = ({ item }: { item: Insignia }) =>(
    <TouchableOpacity onPress={async ()=>{
        let c = await cuantos_ganaron_insignia(item.id)
        setSelectedInsignia({id:item.id,descripcion:item.descripcion,ganada:item.ganada,cant_personas:c,nombre:item.nombre,image_url:item.image_url});
        setShowModalI(true)}} style={styles.dataInsignia}>
      <Image
        style={[styles.insignia,{opacity: item.ganada ? 1:0.5}]}
        source={item.image_url}
        contentFit="cover"
        transition={0}
      /> 
      <View style={{alignSelf:"center",flexWrap:"wrap",}}>
        <ThemedText style={{fontSize:18}} type='bold'>{item.nombre}</ThemedText>
        <ThemedText style={styles.subtitle}>{item.descripcion}</ThemedText>
      </View>
    </TouchableOpacity>
  )
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={paleta.dark_aqua} />
      </View>
    );
  }  

  return (
    <View style={styles.container}>       
        <View  >
            <View style={[styles.header]}>
                <Pressable
                style={[styles.backBtn, { marginBottom: 10,  flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => {   router.back()  }}
                >
                <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnText}>Volver</Text>
                </Pressable>

                <ThemedText style={styles.title} type='title'>Insignias</ThemedText>
            </View>
            <View style={styles.header2}>
            <ThemedText style={styles.sectionTitle}>{categoria?.motivo}</ThemedText>
            <ThemedText style={styles.subtitle}>{cant_ganadas} de {insignias?.length} ganadas</ThemedText>
            <ThemedText style={styles.subtitle}>¡Sigue aprendiendo para ganar más!</ThemedText>
            </View>
           

            <FlatList 
                keyExtractor={(item) => item.id.toString()}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                data={insignias}
                renderItem={renderInsignia}  
                contentContainerStyle={styles.listContent}    
                ListFooterComponent={() => <View style={{height:250}} />}     
            />   
        </View>

        <SmallPopupModal title={selected_insignia?.nombre} modalVisible={showModalI} setVisible={setShowModalI}>
            {selected_insignia && selected_insignia.ganada && (
                <View style={[estilos.centrado,{width:"100%"}]}>
                    <View style={{height:200}}>
                        <Image
                        style={[styles.image2]}
                        source={selected_insignia.image_url}
                        contentFit="contain"
                        transition={0}
                        /> 
                    </View>
                    
                    <View style={[{flexDirection:"row"},estilos.centrado]}>
                        <Ionicons name="people" size={24} color={"#808080"} style={styles.buttonIcon} />
                        <ThemedText style={styles.subtitle}>{selected_insignia.cant_personas}
                            {selected_insignia.cant_personas==1 ? " persona obtuvo esta insignia":" personas obtuvieron esta insignia"} 
                        </ThemedText>
                    </View>
                    <View style={{margin:15}}>
                        <ThemedText style={{textAlign:"center",lineHeight:29}} >                        
                        <ThemedText lightColor='#474646ff' style={{fontSize:20}}>¡Felicidades! Obtuviste una insignia por {selected_insignia.descripcion}.</ThemedText>{' '}
                        <ThemedText lightColor='#474646ff' style={{fontSize:20}}>¡Sigue practicando y aprendiendo para ganar más!</ThemedText>
                        </ThemedText>
                    </View>
                    
                    <Pressable onPress={()=>{setShowModalI(false);contexto.user.gotToModules()}} style={styles.ctaButtonCursos}>
                        <Ionicons name="flash" size={24} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.ctaButtonTextCursos}>Practicar ahora</Text>
                    </Pressable>

                    <Pressable style={estilos.centrado} onPress={()=>setShowModalI(false)}>
                        <ThemedText style={{fontSize:20}} type='bold' lightColor={paleta.dark_aqua}>Cerrar</ThemedText>
                    </Pressable>
                </View>
            )}
            {selected_insignia && !selected_insignia.ganada && (
            <View style={[estilos.centrado,{width:"100%"}]}>
              <View style={{height:200}}>
                  <Image
                  style={[styles.image2,{opacity: 0.4}]}
                  source={selected_insignia.image_url}
                  contentFit="contain"
                  transition={0}
                  /> 
              </View>
              
              <View style={[{flexDirection:"row"},estilos.centrado]}>
                  <Ionicons name="people" size={24} color={"#808080"} style={styles.buttonIcon} />
                  <ThemedText style={styles.subtitle}>100 personas obtuvieron esta insignia</ThemedText>
              </View>
              <View style={{margin:15}}>
                  <ThemedText style={{textAlign:"center",lineHeight:29}} >                        
                  <ThemedText lightColor='#474646ff' style={{fontSize:20}}>Debes {selected_insignia.descripcion} para ganar esta insignia.</ThemedText>{' '}
                  <ThemedText lightColor='#474646ff' style={{fontSize:20}}>¡Sigue practicando y aprendiendo para obtenerla!</ThemedText>
                  </ThemedText>
              </View>
                
              <Pressable onPress={()=>{setShowModalI(false);contexto.user.gotToModules()}} style={styles.ctaButtonCursos}>
                  <Ionicons name="flash" size={24} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.ctaButtonTextCursos}>Practicar ahora</Text>
              </Pressable>

              <Pressable style={estilos.centrado} onPress={()=>setShowModalI(false)}>
                  <ThemedText style={{fontSize:20}} type='bold' lightColor={paleta.dark_aqua}>Cerrar</ThemedText>
              </Pressable>
            </View>
            )}
        </SmallPopupModal>
        <Toast/>
    </View>
  )
}

const styles = StyleSheet.create({
  mainView:{
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    height: '100%',
    marginBottom: 60,
    paddingTop:30 ,
    backgroundColor: paleta.aqua_bck
  },
  header2: {
    marginTop: 15,
    alignContent:"center",
    justifyContent: "flex-start",
    paddingTop: 20,
    width: "100%",
    marginBottom: 15,
    marginLeft: 22
  },
 header: {
    flexDirection: "row",
    alignContent:"center",
    justifyContent: "flex-start",
    paddingTop: 20,
    width: "100%"
  },
  sectionTitle : {
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#222',   
    marginVertical: 5     
  },   
 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
  },
 
  insignia: {    
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: paleta.dark_aqua,
    marginRight: 15,
   
  },
  dataInsignia:{
    flexDirection:"row",
    marginVertical: 10,
    alignContent:"center",
    backgroundColor: "#f8ffffff",
    padding: 7,
    borderRadius: 10
  },
  subtitle : {
    fontSize: 17,
    color: "#808080",  
    marginVertical:2  
  },
   row: {
    flexDirection:"row",
    justifyContent: "space-between"
  },
  separator: {
    height: 10,
  },
 
  container: {
    flex: 1,
    backgroundColor: '#e6f7f2',
    position: 'relative',
    paddingTop: 35,
    width:"100%",
    height:"100%"
  },
  image: {
    flex: 1,
    width: 540,
    height: 540,
    borderRadius: 100,   
  },
  image2: {
    minWidth: 200,
    minHeight:200,
    borderRadius: 100,  
    flex:1
  },
  ctaButtonCursos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20bfa9',
    borderRadius: 14,
    height: 80,
    marginVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: "100%"
  },
  ctaButtonTextCursos: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  backBtn: {    
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    marginTop: 5
    //elevation: 2,
  },
  backBtnText: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title : {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 45,
    textAlign: 'center',
    
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    zIndex: 2,
    
  },
});
