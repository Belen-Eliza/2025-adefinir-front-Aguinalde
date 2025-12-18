import React, { useCallback, useState } from 'react';
import { View, StyleSheet,   TouchableOpacity, Pressable, ActivityIndicator, FlatList,Text, SectionList } from 'react-native';
import {  Ionicons  } from '@expo/vector-icons';
import {   router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { paleta, paleta_colores } from '@/components/colores';
import { estilos } from '@/components/estilos';
import { Image } from 'expo-image';
import { categorias_insignias,  cuantos_ganaron_insignia,  mis_insignias_ganadas,  todas_insignias } from '@/conexiones/insignias';
import { SmallPopupModal } from '@/components/modals';

type Insignia = {
  id: number;
  nombre: string;
  descripcion: string;
  image_url: string;
  motivo:number;
  ganada: boolean;
}

type I ={
  id: number;
  nombre: string;
  descripcion: string;
  image_url: string;
  motivo:number;
  ganada: boolean;
  cant_personas: number
}

type Seccion ={
  title: string;
  data: Insignia[][]
}

export default function Detalle_Insignias () {  
  
  const [secciones,setSecciones] = useState<Seccion[]>([]);
  const [loading,setLoading] = useState(false);

  const [selected_insignia, setSelectedInsignia] = useState<I>();
  const [showModalI,setShowModalI] =useState(false);

  const contexto = useUserContext();  

  useFocusEffect(
      useCallback(() => {
        const fetchData = async () => {
          setLoading(true)
          try {
            const i = await todas_insignias();            
            const c = await categorias_insignias();
            const ganadas = await mis_insignias_ganadas(contexto.user.id);
            if (c && c.length>0 && i && ganadas){
              let s: Seccion[] =[];
              c.forEach(async each=>{
                const insignias_cate = insignias_por_cate(i,each.id);
                const res = insignias_cate.map(each=>{
                  let g = false;
                  if (fue_ganada(ganadas,each)) {g=true;}
                  
                  return {id:each.id,image_url:each.image_url,ganada:g,nombre:each.nombre,motivo:each.motivo,descripcion:each.descripcion}
                })
                s.push({title:each.motivo,data:[res]});
              });
              
              setSecciones(s || [])
            }
            setLoading(false)
          } catch (error) {
            console.error(error);
            error_alert("No se pudo cargar la información de las insignias");
          }            
        };
        fetchData();
        return () => {};
      }, [])
    );
  
  const insignias_por_cate = (i:Insignia[],cate_id:number)=>{
    return i.filter(v=>v.motivo==cate_id)
  }
  const fue_ganada = (ganadas:{id_insignia:number}[],i:Insignia)=>{
    return ganadas.find(each=>each.id_insignia==i.id) != undefined
  }

  const renderInsignia = ({ item }: { item: Insignia }) =>( 
      <TouchableOpacity onPress={async ()=>{
        let c = await cuantos_ganaron_insignia(item.id)
        setSelectedInsignia({id:item.id,descripcion:item.descripcion,ganada:item.ganada,cant_personas:c,nombre:item.nombre,image_url:item.image_url,motivo:item.motivo});
        setShowModalI(true)}} style={[styles.dataInsignia,estilos.centrado]}>
        <Image
          style={[styles.insignia,{opacity: item.ganada ? 1:0.5}]}
          source={item.image_url}
          contentFit="cover"
          transition={0}
          
        /> 
        <View style={estilos.centrado} >
          <ThemedText style={{fontSize:15}} type='bold'>{item.nombre}</ThemedText>
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
        <View style={styles.mainView}>
            <View style={[styles.header]}>
                <Pressable
                style={[styles.backBtn, { marginBottom: 10,  flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => {   contexto.user.gotToProfile()   }}
                >
                <Ionicons name="arrow-back" size={20} color="#20bfa9" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnText}>Volver</Text>
                </Pressable>

                <ThemedText style={styles.title} type='title'>Mis insignias</ThemedText>
            </View>
            
            <View style={styles.formAndImg}> 

              <SectionList
                sections={secciones}
                keyExtractor={(item, index) => index.toString()}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({item})=>(
                  <FlatList 
                  keyExtractor={(item) => item.id.toString()}
                  style={[{maxHeight: 320,minHeight:200}]}
                  data={item}
                  renderItem={renderInsignia} 
                  horizontal={true} 
                  showsHorizontalScrollIndicator={false}
                />
                )}
                style={styles.section}
                contentContainerStyle={{justifyContent: "flex-start",}}
                renderSectionHeader={({section: {title,data}}) => (
                  <View style={styles.row}>
                  <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
                  <Pressable style={{marginRight:10}} onPress={()=>router.push({ pathname: '/tabs/PerfilAlumno/insignias_categoria', params: { id: data[0][0].motivo } })}>
                    <ThemedText style={styles.subtitle}>Ver todas</ThemedText>
                  </Pressable>
                  
                </View>
                )}
                stickySectionHeadersEnabled={false}
                
              />             
            </View>
            <SmallPopupModal title={selected_insignia?.nombre} modalVisible={showModalI} setVisible={setShowModalI}>
            {selected_insignia && selected_insignia.ganada && (
                <View style={[estilos.centrado,{width:"100%"}]}>
                    <View style={{height:200}}>
                        <Image
                        style={styles.image2}
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
  header: {
    flexDirection: "row",
    alignContent:"center",
    justifyContent: "flex-start",
    paddingTop: 20,
    width: "100%"
  },
  formAndImg: {
    width: '100%',
    borderRadius: 10,    
    justifyContent: "center",
    alignItems: 'center',
    height: "100%"
  },  
  title : {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 45,
    textAlign: 'center',
    
  },
  sectionTitle : {
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#222',
    marginVertical: 5,
    marginLeft:12,
    alignSelf: "flex-start"  
  },   
  section:{
    width:"100%",
    marginVertical: 25,
    alignContent: "flex-start",
    
    marginBottom:80
  },
  msg : {
    fontSize: 25, 
    fontWeight:"bold", 
    marginBottom: 15  
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
  },
 
  image: {
    flex: 1,
    width: 100,
    maxWidth: 100,
    height: 100,
    borderRadius: 50,   
  },
  image2: {
    minWidth: 200,
    minHeight:200,
    borderRadius: 100,  
    flex:1
  },
  
  insignia: {    
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: paleta.dark_aqua,
  },
  dataInsignia:{    
    margin: 10,       
    padding: 7,
    borderRadius: 10
  },
  subtitle : {
    fontSize: 14,
    color: 'gray',    
  },
   row: {
    flexDirection:"row",
    justifyContent: "space-between"
  },
  separator: {
    height: 10,
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
});
