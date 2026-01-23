import React, { useCallback,  useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SectionList, 
  RefreshControl,  Modal, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserContext } from '@/context/UserContext';
import ProgressCard from '@/components/ProgressCard';
import GlobalProgress from '@/components/GlobalProgress';
import HistorialItem from '@/components/HistorialItem';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { RatingStars, RatingCard } from '@/components/review';
import { paleta } from '@/components/colores';
import { estilos } from '@/components/estilos';
import { error_alert } from '@/components/alert';
import { getRanking } from '@/conexiones/calificaciones';
import { mis_senias_aprendiendo, mis_senias_dominadas, mis_senias_pendientes, senias_alumno, senias_aprendidas_reporte } from '@/conexiones/aprendidas';
import { Senia } from '@/components/types';
import { mi_progreso_global, mi_progreso_x_modulo, senias_historial } from '@/conexiones/dashboard';

type DatosRanking ={
    id: number;
    username: string;
    promedio: number;
    cant_reviews: number
}

type Modulo = { id: number; nombre: string };
type RelacionModuloVideo = { id_modulo: number; id_video: number };
type HistorialRow = { senia_id: number; updated_at: Date; categoria: string; senia_nombre: string };
type ProgresoGlobal = {learned:number,total:number}
type ProgresoPorModulo ={ id: number; nombre: string; total: number; learned: number }

type SectionType = 'modules' | 'history' | 'ranking';

type DashboardSection = {
  title: string;
  type: SectionType;
  data: any[];
};

export default function DashboardAlumnoScreen() {
  const { user } = useUserContext();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [relaciones, setRelaciones] = useState<RelacionModuloVideo[]>([]);    
  const [senias_aprendiendo,setAprendiendo] = useState<Senia[]>();  
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialRow[]>([]);  
  const [progresoGlobal,setProgresoGlobal] = useState<ProgresoGlobal>({learned:0,total:0});
  const [dataRanking,setDataRanking] = useState<DatosRanking[]>([]);
  const [progresoPorModulo,setProgresoPorModulo]= useState<ProgresoPorModulo[]>([])  

  useFocusEffect(
    useCallback(() => {
      try {
        setLoading(true);
        fetchHistorial();
        fetchProgresoGlobal();
        fetchProgresoModulo();
        fetchRanking();
      } catch (error) {
        error_alert("No se pudo generar el reporte.");
        console.error("[Dashboard]: ",error);
      } finally {
        setLoading(false);
      }
      return () => {
      };
    }, [])
  );

  const fetchHistorial = async () => {
    const h = await senias_historial(user.id);    
    setHistorial(h || [])
  }

  const fetchProgresoGlobal = async () => {
    const p = await mi_progreso_global(user.id);
    setProgresoGlobal(p);
  }
  
  const fetchProgresoModulo = async () => {
    const pm= await mi_progreso_x_modulo(user.id);
    //ordenar


    setProgresoPorModulo(pm);
  }

  const fetchRanking = async () => {
    setLoading(true);    
    try {      
      const d = await getRanking();
      //filtrar los de calificación 0
      const filtered = d.filter(v=>v.promedio!=0)
      //ordenar por mayor ranking
      const orderedAndFiltered = filtered.sort(function(a,b){
          return b.promedio-a.promedio
      });

      setDataRanking(orderedAndFiltered || [])
    } catch (error) {
        error_alert("No se pudo cargar el ranking");
        console.error(error)
    } finally{
        setLoading(false);
        setRefreshing(false)
    }
  } 

  /* const progresoPorModulo = useMemo(() => {
    const byModule: Array<{ id: number; nombre: string; total: number; learned: number }> = [];
    const relsByModule = new Map<number, number[]>();
    relaciones.forEach((r) => {
      const arr = relsByModule.get(r.id_modulo) || [];
      arr.push(r.id_video);
      relsByModule.set(r.id_modulo, arr);
    });
    modulos.forEach((m) => {
      const senias = relsByModule.get(m.id) || [];
      const total = senias.length;
      //revisar!!!
      const learned = senias_aprendiendo?.length || 0 //senias.reduce((acc, sid) => acc + (aprendidasMap[sid] ? 1 : 0), 0);
      byModule.push({ id: m.id, nombre: m.nombre, total, learned });
    });
    // Ordenado por porcentaje completado; y luego nombre ascendente
    byModule.sort((a, b) => {
      const pa = a.total ? a.learned / a.total : 0;
      const pb = b.total ? b.learned / b.total : 0;
      if (pb !== pa) return pb - pa;
      if (b.learned !== a.learned) return b.learned - a.learned;
      return a.nombre.localeCompare(b.nombre);
    });
    return byModule;
  }, [modulos, relaciones, senias_aprendiendo]);

 */
  const onRefresh = () => {
    setRefreshing(true);
    fetchHistorial();
    fetchProgresoGlobal();
    fetchProgresoModulo();
    fetchRanking();    
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#20bfa9" />
        <Text style={{ marginTop: 12, color: '#555' }}>Cargando progreso…</Text>
      </View>
    );
  }

  const sections: DashboardSection[] = [
    { title: 'Progreso por módulo', type: 'modules', data: progresoPorModulo.slice(0, 3) },
    { title: 'Señas aprendidas recientemente', type: 'history', data: historial.slice(0, 3) },
    {title: "Ranking profesores", type: "ranking", data: dataRanking?.slice(0,3)}
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => (item?.id ? String(item.id) : `${item?.senia_id}-${item?.created_at || index}`)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        SectionSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={() => (
          <View style={styles.headerBox}>
            <Text style={styles.titleCursos}>Dashboard de Aprendizaje</Text>
            <GlobalProgress learned={progresoGlobal.learned} total={progresoGlobal.total} />
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Pressable onPress={() => router.navigate('/tabs/Dashboard_Alumno/objetivos_activos')}>
                <Text  style={{ color: '#0a7ea4', fontWeight: 'bold' }}>
                Ver objetivos activos
              </Text></Pressable>
              <Pressable onPress={() => router.navigate('/tabs/Dashboard_Alumno/reporte_historico' )}>
                <Text style={{ color: '#0a7ea4', fontWeight: 'bold', marginTop: 6 }}>
                Ver reporte histórico
              </Text></Pressable>
              
            </View>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                <Text style={styles.errorText}> {error} </Text>
              </View>
            )}
          </View>
        )}
        ListHeaderComponentStyle={{ paddingHorizontal: 18 }}
        ListFooterComponent={<View style={{ height: 24 }} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>          
        )}
        renderSectionFooter={({ section }) => (
          section.data.length === 0 ? (
            <Text style={styles.emptyText}>
              {section.type === 'modules' ? 'No hay módulos disponibles.' : 'Aún no hay señas aprendidas.'}
            </Text>
          ) : 
          section.type=== 'ranking' ? (
            <TouchableOpacity style={[styles.badge,estilos.centrado]} onPress={()=>router.navigate("/tabs/Dashboard_Alumno/ranking")}>
              <ThemedText type='defaultSemiBold' lightColor='white'>Ver ranking completo</ThemedText>
            </TouchableOpacity>
            
          ):null
        )}
        renderItem={({ item, section }) => (
          section.type === 'modules' ? (
            <ProgressCard
              title={item.nombre}
              learned={item.learned}
              total={item.total}
              onPress={() => router.push({ pathname: '/tabs/Modulos_Alumno/modulo_detalle', params: { id: String(item.id) } })}
            />
          ) : 
            section.type === 'history'?
          (
            <HistorialItem
              nombre={item.senia_nombre}
              modulo={item.categoria}
              fechaISO={item.updated_at}
            />
          ): (
            <RatingCard nombre={item.username} rating={item.promedio} cant_reviews={item.cant_reviews}/>
          )
        )}
      />        

       
      <Toast/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7f2' },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  headerBox: { paddingBottom: 8 },
  titleCursos: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 60,
    marginBottom: 28,
    alignSelf: 'center',
    letterSpacing: 0.5,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 8, marginBottom: 8 },
  historialHeader: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 8, marginBottom: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 10, borderWidth: 1, borderColor: '#f5c2c0' },
  errorText: { color: '#e74c3c', marginLeft: 6 },
  emptyText: { color: '#777', alignSelf: 'center', marginVertical: 6 },
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
  separator: {
    height: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '70%',
  },
  badge: {
    backgroundColor: paleta.aqua,    
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '600',
    
  },
});
