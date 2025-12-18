import React, { useCallback, useState } from 'react';
import { View, StyleSheet,   TouchableOpacity, Pressable, ActivityIndicator, FlatList } from 'react-native';
import {  Ionicons  } from '@expo/vector-icons';
import {  router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { error_alert, success_alert } from '@/components/alert';
import Toast from 'react-native-toast-message';
import { useUserContext } from '@/context/UserContext';
import { paleta, paleta_colores } from '@/components/colores';
import { estilos } from '@/components/estilos';
import { Image } from 'expo-image';
import { cambiar_mi_avatar, my_avatar, todos_avatares } from '@/conexiones/avatars';
import { mi_racha } from '@/conexiones/racha';
import { useXP } from '@/components/animations/useXP';
import { mis_modulos_completos } from '@/conexiones/modulos';
import { Avatar } from '@/components/types';
import { mis_insignias, mis_insignias_ganadas, todas_insignias } from '@/conexiones/insignias';

type Insignia = {
  id: number;
  nombre: string;
  descripcion: string;
  image_url: string;
}

export default function Perfil (){
  const [racha,setRacha] = useState(0);
  const [modulos_completos,setModulos] = useState(0);
  const [pfp,setPfp]=useState<Avatar>();
  const [avatares,setAvatares] = useState<Avatar[]>();
  const [insignias,setInsignias] = useState<Insignia[]>();
  const [loading,setLoading] = useState(false);

  const insignia = require("../../../assets/images/insignia.png");
    
  const contexto = useUserContext();   
  const { xp, level, delta, consumeDelta } = useXP(contexto.user.id);

    useFocusEffect(
      useCallback(() => {
        const fetchData = async () => {
          setLoading(true)
          try {
            const p = await my_avatar(contexto.user.id);
            const img = require("../../../assets/images/pfp.jpg");
            
            if (p.Avatar) {setPfp(p.Avatar)}
            else setPfp({image_url:img,id:1,racha_desbloquear:1});

            const a = await todos_avatares();            
            const r = await mi_racha(contexto.user.id);
            let avatares_desbloqueados =a;
            
            if (a && a.length>0) {
              avatares_desbloqueados = desbloqueados(a,r.racha_maxima);
              //primero los últimos que desbloqueaste
              avatares_desbloqueados.sort(function(a,b){
                if (a.racha_desbloquear > b.racha_desbloquear){
                  return -1
                } if (a.racha_desbloquear < b.racha_desbloquear){
                  return 1
                } return 0
              })
            }            
            setAvatares(avatares_desbloqueados || []);  
            setRacha(r.racha);
            
            const m= await mis_modulos_completos(contexto.user.id);
            if (m && m.length>0) setModulos(m.length);

            const i = await mis_insignias(contexto.user.id);
            setInsignias(i || []);                  

            setLoading(false)
          } catch (error) {
            console.error(error);
            error_alert("No se pudo cargar tu perfil");
          }            
        };
        fetchData();
        return () => {};
      }, [])
    );

  const cambiar_avatar = async (a:Avatar) => {
    try {
      await cambiar_mi_avatar(contexto.user.id,a.id);
      setPfp(a)
      success_alert("¡Tu avatar fue cambiado con éxito!")
    } catch (error) {
      console.error(error);
      error_alert("No se pudo cambiar tu avatar");
    }
  }

  const renderAvatar = ({ item }: { item: Avatar }) =>(
    <TouchableOpacity 
      onPress={()=>cambiar_avatar(item)}
      style={[{margin:5},item.id==pfp?.id ? styles.round_border:{}]}>
      <Image
        style={[styles.image]}
        source={item.image_url}
        contentFit="contain"
        transition={0}
      /> 
    </TouchableOpacity>
  )

  const renderInsignia = ({ item }: { item: Insignia }) =>(
    <View style={styles.dataInsignia}>
      <Image
        style={[styles.insignia]}
        source={item.image_url}
        contentFit="cover"
        transition={0}
      /> 
      <View style={{alignSelf:"center"}}>
        <ThemedText type='bold'>{item.nombre}</ThemedText>
        <ThemedText style={styles.subtitle}>{item.descripcion}</ThemedText>
      </View>
    </View>
  )
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={paleta.dark_aqua} />
      </View>
    );
  }   

  const desbloqueados = (avatares:Avatar[],racha_max:number)=>{
    const d =avatares.filter(each=>each.racha_desbloquear<=racha_max)
    return d
  }

    return(
        <View style={[styles.mainView,{backgroundColor:paleta.aqua_bck}]}>
          <View style={styles.bck_top}></View>
          
            <View style={styles.dataAndImg}>
              <Image
                style={[styles.image]}
                source={pfp?.image_url}
                contentFit="contain"
                transition={1000}
              /> 

              <View style={styles.stats}>
                <ThemedText type='bold'>{xp}</ThemedText>
                <ThemedText>XP</ThemedText>
              </View>
              <View style={styles.stats}>
                <ThemedText type='bold'>{level}</ThemedText>
                <ThemedText>nivel</ThemedText>
              </View>
              
              <View style={styles.stats}>
                <ThemedText type='bold'> {racha}</ThemedText>
                <ThemedText>racha</ThemedText>
              </View>
              
              <View style={styles.stats}>
                <ThemedText type='bold' > {modulos_completos}</ThemedText>
                <ThemedText>módulos</ThemedText>
              </View>
            
            </View>      
            <View style={styles.nameAndMail}>
              <ThemedText type='title'>{contexto.user.username}</ThemedText>
              <View style={{marginTop: 5,flexDirection:"row"}}>
                <ThemedText style={{fontSize:14}} >{contexto.user.mail}</ThemedText>
                <Pressable onPress={()=>router.push("/tabs/PerfilAlumno/editar_perfil")}>
                    <Ionicons style={styles.icon} name='pencil' size={18} color={paleta.aqua} />
                </Pressable> 
              </View>                              
            </View>    
            <View style={styles.form}>
            <View style={[styles.seccion]}>
              <View style={styles.row}>
                <ThemedText style={styles.title}>Mis insignias</ThemedText>
                <Pressable onPress={()=>router.push("/tabs/PerfilAlumno/detalle_insignias")}>
                  <ThemedText style={styles.subtitle}>Ver todas</ThemedText>
                </Pressable>
                
              </View>
              <FlatList 
                keyExtractor={(item) => item.id.toString()}
                style={[{maxHeight:220}]}
                data={insignias?.slice(0,2)}
                renderItem={renderInsignia}                
              />             
              
            </View>

            <View style={styles.seccion}>
              <View style={[styles.row,{marginBottom:3}]}>
                <ThemedText style={styles.title}>Avatares desbloqueados</ThemedText>
                <Pressable onPress={()=>router.push("/tabs/PerfilAlumno/gestion_avatars")}>
                  <ThemedText style={styles.subtitle}>Ver todos</ThemedText>
                </Pressable>
                
              </View>
              <FlatList 
                keyExtractor={(item) => item.id.toString()}
                style={[{maxHeight:220}]}
                data={avatares?.slice(0,6)}
                renderItem={renderAvatar}
                numColumns={3}
                columnWrapperStyle={{marginHorizontal:10}}
              />
            </View>
            </View>

          <Toast/>
        </View>
    )
}


const styles = StyleSheet.create({
  mainView:{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
    marginBottom: 60,
    paddingTop:30 ,    
  },
  bck_top:{
    width: "100%",
    position: "absolute",
    top: 0,
    left:0,
    backgroundColor: paleta.turquesa,
    height: 100,
    
  },
  stats:{
    marginHorizontal:15,
    alignSelf: "flex-end",
    alignContent: "center"
  },
  nameAndMail: {
    position: "absolute",
    top:180,
    left:30 ,
    
  },
  
  dataAndImg: {
    width: '100%',        
    justifyContent: "space-between",
    alignItems: 'center',    
    flexDirection:"row",
    paddingHorizontal: 10,
    position: "absolute",
    top: 60,
    
  },
  row: {
    flexDirection:"row",
    justifyContent: "space-between"
  }, 
  title : {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#222'  
  },   
  subtitle : {
    fontSize: 14,
    color: 'gray',    
  },  
  icon: {
      marginRight: 10,
      marginLeft: 10
  },
  image: {
    flex: 1,
    width: 100,
    maxWidth: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: paleta.dark_aqua,
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
  },
  insignia: {
    flex: 1,
    width: 60,
    maxWidth: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: paleta.dark_aqua, 
    marginRight: 15   
  },
  dataInsignia:{
    flexDirection:"row",
    marginVertical: 10,
    alignContent:"center",
    backgroundColor: "#f8ffffff",
    padding: 7,
    borderRadius: 10
  },
  seccion: {
    width:"100%", 
    paddingHorizontal:15,
    marginTop: 15,
    
  },
  form:{
    width:"100%",
    position:"absolute",
    top: 250
  },
  round_border:{
    borderColor:paleta.aqua,
    borderWidth:2,
    borderRadius: 40,
    backgroundColor:paleta.turquesa
  }
});
