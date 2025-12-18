import React, { useState, useEffect, useCallback,  } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, runOnJS } from 'react-native-reanimated';
import ConfettiBurst from '@/components/animations/ConfettiBurst';
import { useXP } from '@/components/animations/useXP';
import { XPGainPop } from '@/components/animations/XPGainPop';
import { router, useFocusEffect } from 'expo-router';
import { useUserContext } from '@/context/UserContext';
import { modulos_completados_por_alumno, progreso_por_categoria } from '@/conexiones/modulos';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import { paleta } from '@/components/colores';
import { mi_racha, perder_racha, sumar_racha } from '@/conexiones/racha';
import { error_alert } from '@/components/alert';
import { es_hoy, fue_ayer, now } from '@/components/validaciones';
import { BotonLogin } from '@/components/botones';
import { AnimatedButton } from '@/components/animations/AnimatedButton';
import { ProgressBarAnimada } from '@/components/animations/ProgressBarAnimada';
import { SuccessModal } from '@/components/animations/SuccessModal';
import { estilos } from '@/components/estilos';
import { useDailyMissions } from '@/hooks/useDailyMissions';
import { MissionCard } from '@/components/missions/MissionCard';
import { desbloquee_un_avatar, nuevo_avatar_desbloqueado } from '@/conexiones/avatars';
import { Avatar } from '@/components/types';
import { ThemedText } from '@/components/ThemedText';
import { ganar_insignia_racha } from '@/conexiones/insignias';
import { XPCard } from '@/components/cards';
import type { Mission } from '@/conexiones/misiones';

export default function HomeStudent() {
  const contexto = useUserContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState({ 
    id: contexto.user.id,
    nombre: contexto.user.username,
    racha: 0,
    modulosCompletados: 0,
  });  
  const [progresoCategorias, setProgresoCategorias] = useState<Array<any>>([]);

  const [showModalRacha,setShowModalRacha] = useState(false);
  const fuego_racha = require("../../../assets/images/fire3.gif");
  const racha_perdida =require("../../../assets/images/disappointedBeetle.gif");

  const [showModalAvatar,setShowModalAvatar] = useState(false);
  const [nuevo_avatar, setNuevoAvatar] = useState<String>();
  const [desbloqueado,setDesbloqueado] = useState(false);
  const [streakPopTrigger, setStreakPopTrigger] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useFocusEffect(
      useCallback(() => {
        const fetchModulosCompletados = async () => {
        const completados = await modulos_completados_por_alumno(contexto.user.id);
        setUser(prev => ({ ...prev, modulosCompletados: completados || 0 }));
        //console.log('Modulos completados actualizados:', completados);
        };

        fetchModulosCompletados();
        fetch_racha();
          return () => {};
        }, [])
      );


  useEffect(()=>{
    let mounted = true;
    const load = async () =>{
      try{
        const data = await progreso_por_categoria(contexto.user.id);
        if(mounted) setProgresoCategorias(data || []);
        //console.log('Progreso por categoría cargado:', data);
      }catch(err){ console.error('Error cargando progreso por categoría', err) }
    }
    if(contexto.user && contexto.user.id) load();
    return ()=>{ mounted = false }
  }, [contexto.user.id]);

  // Confetti al entrar a la app (refuerzo visual inmediato)
  useEffect(() => {
    setShowConfetti(true);
  }, []);

  // Solo mostrar las primeras 3 categorías en la vista principal
  const topCategorias = progresoCategorias.slice(0, 3);
  const hayMasCategorias = progresoCategorias.length > 3;

  // Componente para renderizar una barra de categoría
  const CategoriaProgressBar = ({ categoria, index }: { categoria: any, index: number }) => (
    <View key={String(categoria.categoriaId || index)} style={styles.categoriaItem}>
      <View style={styles.categoriaHeader}>
        <Text style={styles.categoriaNombre}>{categoria.nombre}</Text>
        <Text style={styles.categoriaPorcentaje}>{categoria.porcentaje}%</Text>
      </View>
      <ProgressBarAnimada progress={categoria.porcentaje} />
    </View>
  );

  const { xp, level, delta, consumeDelta } = useXP(contexto.user.id);

  const fetch_racha = async () => {
    try {
      /* const r = await mi_racha(contexto.user.id);
      let nuevaRacha = 1;
      let cambio = false;
      if (r) {
        const ultimoLogin = new Date(r.last_login);
        const hoy = new Date();
        const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDias = Math.round((normalize(hoy).getTime() - normalize(ultimoLogin).getTime()) / 86400000);
        if (diffDias === 1) {
          const desbloquee = await desbloquee_un_avatar(r.racha + 1, r.racha_maxima);
          setDesbloqueado(desbloquee);
          await sumar_racha(contexto.user.id);
          nuevaRacha = r.racha + 1;
          cambio = true;
          setStreakPopTrigger(t => t + 1);
          setShowConfetti(true);
          console.log('Racha incrementada. diffDias=1');
        } else if (diffDias > 1) {
          await perder_racha(contexto.user.id);
          cambio = true;
          nuevaRacha = 1;
          console.log('Racha perdida. diffDias>', diffDias);
        } else if (diffDias === 0) {
          nuevaRacha = r.racha;
          console.log('Racha se mantiene. diffDias=0');
        }
        else {
          racha= r.racha;
          console.log("es hoy; no sumo ni pierdo")
        }      
        ganar_insignia_racha(contexto.user.id);
      }
      setUser(prev => ({ ...prev, racha: nuevaRacha || 0 })); */
      const r = await mi_racha(contexto.user.id);
      let racha = 1;
      let cambio = false;
      if (r) {
        let ultimo_login =new Date(r.last_login);        
        if (fue_ayer(ultimo_login)) { 
          await sumar_racha(contexto.user.id);
          racha= r.racha+1;
          console.log("sumo racha",r.last_login)
          cambio=true;
        }
        else if (!es_hoy(ultimo_login)) {
          await perder_racha(contexto.user.id);
          console.log("pierdo racha",r.last_login);
          cambio=true;
        }
        else {
          racha= r.racha;
          console.log("es hoy; no sumo ni pierdo")
        }        
      }
      setUser(prev => ({ ...prev, racha: racha || 0 }));
      setTimeout(()=>{setShowModalRacha(cambio);},400)
      
    } catch (error) {
      console.error(error);
      error_alert("Ocurrió un error al cargar la racha");
    }    

    //debug!!!!!!!
    //setShowModalRacha(true)
  };

  const cerrar_modal_racha = async () => {
    try {            
      if (desbloqueado) {        
        //modal avatar nuevo    
        const a:Avatar = await nuevo_avatar_desbloqueado(user.racha) ;
        setNuevoAvatar(a.image_url);
        setShowModalRacha(false);
        setShowModalAvatar(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShowModalRacha(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Hola, {contexto.user.username} 👋</Text>
        
        <View style={styles.stackCards}>
          <View style={[styles.card, styles.cardLeft]}> 
            <AnimatedFlame trigger={streakPopTrigger} />
            <Text style={styles.cardTitleCursos}>{user.racha} {user.racha ==1 ? 'día':'días'} de racha</Text>
            <Text style={styles.xpInfo}>Nivel {level} • {xp} XP</Text>
            <XPGainPop amount={delta} onDone={consumeDelta} />
          </View>
          <Pressable style={[styles.card, styles.cardRight]} onPress={() => router.push('/tabs/Dashboard_Alumno')}>
            <Text style={styles.cardTitleCursos}>{user.modulosCompletados}</Text>
            <Text style={styles.cardTitleCursos}>{user.modulosCompletados==1 ? "módulo completo":"módulos completos"}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, {marginTop: 8, marginBottom: 20}]}>
          <View style={styles.categoriasHeader}>
            <Text style={styles.categoriasTitle}>Tus categorías más aprendidas</Text>
            {hayMasCategorias && (
              <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                style={styles.verTodasButton}
              >
                <Text style={styles.verTodasText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{alignItems: 'center', marginBottom: 10, width: "100%"}}>
          {progresoCategorias.length === 0 && <Text style={{color:'#666'}}>Aún no hay progreso por categoría</Text>}
          <ScrollView style={{maxHeight: 200, maxWidth: '100%', width: "100%"}}>
            {topCategorias.map((categoria, idx) => (
              <CategoriaProgressBar key={categoria.categoriaId} categoria={categoria} index={idx} />
            ))}
          </ScrollView>
          </View>
        </View>
        
        <AnimatedButton title="Practicar ahora" onPress={() => router.push('/tabs/Dashboard_Alumno')} style={styles.ctaButtonCursos} textStyle={styles.ctaButtonTextCursos} />

        <View style={styles.shortcutsRow}>
          <Pressable style={styles.shortcutCardCursos} onPress={() => router.push('/tabs/leaderboard_grupo')}>
            <Ionicons name="trophy" size={22} color="#20bfa9" />
            <Text style={styles.shortcutTextCursos}>Ranking</Text>
          </Pressable>
          <Pressable style={styles.shortcutCardCursos} onPress={() => router.push('/tabs/HomeStudent/alumno_objetivos')}>
            <Ionicons name="flag" size={22} color="#20bfa9" />
            <Text style={styles.shortcutTextCursos}>Mis objetivos</Text>
          </Pressable>
        </View>

        {/* Misiones Diarias Preview */}
        <DailyMissionsPreview userId={contexto.user.id} router={router} />
      </ScrollView>

      {/* Modal para mostrar todas las categorías */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Todas las categorías</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={28} color="#20bfa9" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {progresoCategorias.map((categoria, idx) => (
                <CategoriaProgressBar key={categoria.categoriaId} categoria={categoria} index={idx} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de sumar o perder racha */}
        <Modal
          visible={showModalRacha}
          animationType="fade"
          transparent={true}
        >
          <View style={[styles.modalContainerRacha,estilos.centrado]}>
            <View style={[styles.modalContent,{height:"100%"}]}>
              {user.racha==1 ? (
                <View>
                    
                    <Image
                      style={[styles.modal_image,estilos.centrado]}
                      source={racha_perdida}
                      contentFit="contain"
                      transition={0}
                    />
                    <Text style={[styles.title_racha]}>Perdiste tu racha</Text>
                    <ThemedText type='defaultSemiBold' lightColor={paleta.dark_aqua}>Practica diariamente para volver a encaminarte</ThemedText>
                
                <BotonLogin callback={()=>setShowModalRacha(false)} textColor={'black'} bckColor={paleta.turquesa} text={'Aceptar'}  />
                </View>
                ):(
                  <View >
                    <View style={[{flexDirection:"row",alignSelf:"flex-end"}]}> 
                      <Ionicons name="flame" size={28} color={paleta.strong_yellow} style={{marginBottom: 8}} />
                      <Text style={[styles.cardTitleCursos,estilos.centrado]}>{user.racha} </Text>
                    </View>
                    <Image
                      style={[styles.modal_image,estilos.centrado]}
                      source={fuego_racha}
                      contentFit="cover"
                      transition={0}
                    />
                  <XPCard borderColor={paleta.turquesa} bckColor={paleta.turquesa} textColor={'white'} 
                    title={'XP ganado'} cant={user.racha*2} icon='barbell' iconColor={paleta.dark_aqua}/>
                <ThemedText style={[styles.title_racha]}>¡¡Tienes {user.racha} días de racha!!</ThemedText>
                <ThemedText type='defaultSemiBold' lightColor={paleta.dark_aqua}>¡Sigue aprendiendo mañana para llegar a {user.racha+1}!</ThemedText>
                <BotonLogin callback={cerrar_modal_racha} textColor={'black'} bckColor={paleta.turquesa} text={'Aceptar'}  />
                </View>
                )}                                          
                
              
            </View>
          </View>
        </Modal>
        <SuccessModal visible={false} title="¡Excelente!" subtitle="Acción completada" onClose={() => {}} />

        {/* Modal de desbloaquear un nuevo avatar */}
        <Modal
          visible={showModalAvatar}
          animationType="fade"
          transparent={true}
        >
          <View style={[styles.modalContainer,estilos.centrado,{width:"100%"}]}>
            <View style={[styles.modalContent,{height:"60%",borderBottomEndRadius:20,borderBottomStartRadius:20}]}>             
                  <View>
                    <Text style={[styles.title_racha,estilos.centrado]}>¡¡Desbloqueaste un nuevo avatar!!</Text>
                    <Image
                      style={[styles.image]}
                      source={nuevo_avatar? nuevo_avatar : fuego_racha}
                      contentFit="contain"
                      transition={0}
                    />
                  <BotonLogin callback={()=>{setShowModalAvatar(false);contexto.user.gotToProfile()}} textColor={'black'} bckColor={paleta.turquesa} text={'Equipar'}  />                
                  <Pressable style={[estilos.centrado,{marginTop:10}]} onPress={()=>setShowModalAvatar(false)}>
                    <ThemedText lightColor={paleta.dark_aqua} type='subtitle'>Cerrar</ThemedText>
                  </Pressable>
                </View>                                                                                      
            </View>
          </View>
        </Modal>
  {showConfetti && <ConfettiBurst visible={showConfetti} onDone={() => setShowConfetti(false)} />}
  <Toast/>
    </View>
  );
}

// Componente de fueguito animado (pulso continuo + leve glow)
function AnimatedFlame({ trigger }: { trigger: number }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const pop = useSharedValue(0);
  useEffect(() => {
    scale.value = withRepeat(withSequence(
      withTiming(1.18, { duration: 600 }),
      withTiming(1.0, { duration: 600 })
    ), -1, true);
    glow.value = withRepeat(withSequence(
      withTiming(1, { duration: 700 }),
      withTiming(0, { duration: 700 })
    ), -1, true);
  }, []);
  // Pop cuando trigger cambia (racha aumenta)
  useEffect(() => {
    if (trigger === 0) return;
    pop.value = 0;
    pop.value = withSequence(
      withTiming(1, { duration: 90 }),
      withTiming(0, { duration: 320 })
    );
  }, [trigger]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value + pop.value * 0.5 }],
    shadowColor: '#ff6d00',
    shadowOpacity: 0.4 * glow.value + 0.5 * pop.value,
    shadowRadius: 16 + 10 * glow.value + 14 * pop.value,
    shadowOffset: { width: 0, height: 4 }
  }));
  return (
    <Animated.View style={[{ marginBottom: 8, alignSelf: 'flex-start' }, animatedStyle]}>
      <Ionicons name="flame" size={52} color={paleta.strong_yellow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f7f2',
    position: 'relative',
    paddingTop: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 32,
    marginBottom: 38,
    alignSelf: 'center',
    zIndex: 2,
    letterSpacing: 0.5,
  },
  stackCards: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    flex: 1, 
    alignItems: 'flex-start',
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  cardLeft: {
    marginRight: 6,
  },
  cardRight: {
    marginLeft: 6,
  },
  cardTitleCursos: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    fontFamily: 'System',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  xpInfo: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#555'
  },
  categoriasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoriasTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  verTodasButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  verTodasText: {
    color: '#20bfa9',
    fontWeight: '600',
    fontSize: 10,
    marginLeft: 20
  },
  categoriaItem: {
    marginBottom: 14,
  },
  categoriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoriaNombre: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  categoriaPorcentaje: {
    fontWeight: '600',
    fontSize: 14,
    color: '#20bfa9',
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#20bfa9',
    borderRadius: 6,
  },
  ctaButtonCursos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20bfa9',
    borderRadius: 14,
    height: 50,
    marginBottom: 18,
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
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shortcutCardCursos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  shortcutTextCursos: {
    color: '#20bfa9',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 6,
    fontFamily: 'System',
  },

  // Estilos para el modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    paddingBottom: 20,
    maxHeight: 400
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",    
  },
  title_racha: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    marginTop:60,
    color: paleta.dark_aqua,
    alignSelf: "center",
  },
  modalContainerRacha: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'white',
    height:"100%",
    width:"100%"
  },
  modal_image:{
    flex: 2,
    width: "120%",
    height: "120%", },
  missionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionBox: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  missionEmpty: {
    color: '#777',
    fontSize: 13,
    alignSelf: 'center',
    marginTop: 2,
  },
  seeAllLink: {
    color:'#0a7ea4',
    fontWeight:'600'
  }
});

// Subcomponente para preview de misiones diarias
function DailyMissionsPreview({ userId, router }: { userId: number; router: any }) {
  const { missions, progressRatio, allCompleted } = useDailyMissions(userId);
  const mostrar = missions.slice(0,2);
  return (
    <View style={styles.missionBox}>
      <View style={styles.missionHeaderRow}>
        <Text style={{ fontSize:18, fontWeight:'bold', color:'#222' }}>Misiones de hoy</Text>
        <Text style={styles.seeAllLink} onPress={() => router.push('/tabs/misiones')}>Ver todas</Text>
      </View>
      {missions.length === 0 && (
        <Text style={styles.missionEmpty}>Se generarán al comenzar el día.</Text>
      )}
      {mostrar.map((m: Mission) => (
        <MissionCard key={m.id} mission={m} />
      ))}
      <Text style={{ marginTop:4, fontSize:12, color:'#555' }}>Progreso global: {Math.round(progressRatio*100)}% {allCompleted? '✔':''}</Text>
      {allCompleted && (
        <Text style={{ marginTop:6, fontSize:13, fontWeight:'600', color:'#ff9800' }}>¡Todas completadas! Bonus aplicado.</Text>
      )}
    </View>
  );
}
