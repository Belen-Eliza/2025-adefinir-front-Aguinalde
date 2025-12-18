import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SectionList, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserContext } from '../../context/UserContext';
import { supabase } from '../../lib/supabase';
import ProgressCard from '../../components/ProgressCard';
import GlobalProgress from '../../components/GlobalProgress';
import HistorialItem from '../../components/HistorialItem';
import { useFocusEffect } from '@react-navigation/native';
import { fetchGroupLeaderboard } from '../../conexiones/leaderboard';
import { useDailyMissions } from '../../hooks/useDailyMissions';
import { MissionCard } from '../../components/missions/MissionCard';


type Modulo = { id: number; nombre: string };
type RelacionModuloVideo = { id_modulo: number; id_video: number };
type HistorialRow = { senia_id: number; aprendida: boolean; created_at: string; modulo_nombre: string; senia_nombre: string };

type SectionType = 'modules' | 'history';

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
  const [aprendidasMap, setAprendidasMap] = useState<Record<number, boolean>>({}); 
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialRow[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<Array<{ position: number; name: string; xp: number }>>([]);
  // Misiones diarias (preview)
  const { missions, allCompleted, progressRatio } = useDailyMissions(user?.id);

  const fetchData = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!user?.id) {
        setModulos([]);
        setRelaciones([]);
        setAprendidasMap({});
        setHistorial([]);
        return;
      }
      const { data: mods, error: modErr } = await supabase
        .from('Modulos')
        .select('id, nombre')
        .order('id', { ascending: true });
      if (modErr) throw modErr;

      const { data: rels, error: relErr } = await supabase
        .from('Modulo_Video')
        .select('id_modulo, id_video');
      if (relErr) throw relErr;

      const aprendidas: Record<number, boolean> = {};
      try {
        const { data: as, error: asErr } = await supabase
          .from('Alumno_Senia') 
          .select('senia_id, aprendida')
          .eq('user_id', user.id);
        if (!asErr && as) {
          as.forEach((row: any) => {
            aprendidas[row.senia_id] = !!row.aprendida;
          });
        } else if (asErr) {
          console.warn('[dashboard] Alumno_Senia no disponible (aprendidasMap):', asErr?.message);
        }
      } catch (e: any) {
        console.warn('[dashboard] Alumno_Senia no disponible (aprendidasMap try/catch):', e?.message);
      }

      let historialRows: HistorialRow[] = [];
      try {
        const { data: hist, error: histErr } = await supabase
          .from('Alumno_Senia')
          .select('senia_id, aprendida, created_at')
          .eq('user_id', user.id)
          .eq('aprendida', true)
          .order('created_at', { ascending: false });
        if (histErr) throw histErr;

        if (hist && hist.length) {
          const { data: senias, error: seniaErr } = await supabase
            .from('Senias')
            .select('id, significado');
          if (seniaErr) throw seniaErr;

          const { data: relsAll, error: relsAllErr } = await supabase
            .from('Modulo_Video')
            .select('id_modulo, id_video');
          if (relsAllErr) throw relsAllErr;

          const seniaNombreMap = new Map<number, string>();
          senias?.forEach((s: any) => seniaNombreMap.set(Number(s.id), String(s.significado)));
          const moduloNombreMap = new Map<number, string>();
          (mods || []).forEach((m: Modulo) => moduloNombreMap.set(m.id, m.nombre));
          //(mods || []).forEach((m) => moduloNombreMap.set(m.id, m.nombre));
          const videoToModulo = new Map<number, number>();
          relsAll?.forEach((r: any) => videoToModulo.set(Number(r.id_video), Number(r.id_modulo)));

          historialRows = hist.map((h: any) => {
            const seniaId = Number(h.senia_id);
            const moduloId = videoToModulo.get(seniaId);
            return {
              senia_id: seniaId,
              aprendida: !!h.aprendida,
              created_at: h.created_at,
              modulo_nombre: moduloId ? (moduloNombreMap.get(moduloId) || 'Módulo') : 'Módulo',
              senia_nombre: seniaNombreMap.get(seniaId) || 'Seña',
            } as HistorialRow;
          });
        }
      } catch (e: any) {
        console.warn('[dashboard] Historial no disponible:', e?.message);
      }

      setModulos(mods || []);
      setRelaciones(rels || []);
      setAprendidasMap(aprendidas);
      setHistorial(historialRows);


      try {
        const { data: membership } = await supabase
          .from('group_users')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        const gid = membership?.group_id ? Number(membership.group_id) : null;
        setGroupId(gid);
        if (gid) {
          const resp = await fetchGroupLeaderboard('week', gid, Number(user.id));
          const top5 = (resp.entries || []).slice(0, 5).map((e: any) => ({ position: Number(e.position || 0), name: String(e.name || 'Alumno'), xp: Number(e.xp || 0) }));
          //const top5 = (resp.entries || []).slice(0, 5).map(e => ({ position: Number(e.position || 0), name: String(e.name || 'Alumno'), xp: Number(e.xp || 0) }));
          setLeaderboardPreview(top5);
        } else {
          setLeaderboardPreview([]);
        }
      } catch (e: any) {
        console.warn('[dashboard] leaderboard preview error:', e?.message);
        setLeaderboardPreview([]);
      }
    } catch (e: any) {
      console.error('[dashboard] fetch error:', e?.message);
      setError('Ocurrió un problema al cargar algunos datos. Parte del contenido puede no estar disponible.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`rt-alumno-senia-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Alumno_Senia', filter: `user_id=eq.${user.id}` },
        (_payload: any) => {
          
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [user?.id]);

 
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [user?.id])
  );

  const progresoPorModulo = useMemo(() => {
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
      const learned = senias.reduce((acc, sid) => acc + (aprendidasMap[sid] ? 1 : 0), 0);
      byModule.push({ id: m.id, nombre: m.nombre, total, learned });
    });
    
    byModule.sort((a, b) => {
      const pa = a.total ? a.learned / a.total : 0;
      const pb = b.total ? b.learned / b.total : 0;
      if (pb !== pa) return pb - pa;
      if (b.learned !== a.learned) return b.learned - a.learned;
      return a.nombre.localeCompare(b.nombre);
    });
    return byModule;
  }, [modulos, relaciones, aprendidasMap]);

  const progresoGlobal = useMemo(() => {
    return progresoPorModulo.reduce(
      (acc, m) => ({ total: acc.total + m.total, learned: acc.learned + m.learned }),
      { total: 0, learned: 0 }
    );
  }, [progresoPorModulo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
    { title: 'Progreso por módulo', type: 'modules', data: progresoPorModulo },
    { title: 'Historial de señas aprendidas', type: 'history', data: historial.slice(0, 3) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => (item?.id ? String(item.id) : `${item?.senia_id}-${item?.created_at || index}`)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.headerBox}>
            <Text style={styles.titleCursos}>Dashboard de Aprendizaje</Text>
            <GlobalProgress learned={progresoGlobal.learned} total={progresoGlobal.total} />
            <View style={styles.leaderboardBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>Leaderboard del grupo</Text>
                <Text
                  onPress={() => (router as any).push('/tabs/leaderboard_grupo')}
                  //onPress={() => router.push('/tabs/leaderboard_grupo')}
                  style={{ color: '#0a7ea4', fontWeight: '600' }}
                >
                  Ver completo
                </Text>
              </View>
              {leaderboardPreview.length === 0 ? (
                <Text style={styles.emptyText}>No hay ranking disponible aún.</Text>
              ) : (
                leaderboardPreview.map((row) => (
                  <View key={`${row.position}-${row.name}`} style={styles.lbRow}>
                    <Text style={styles.lbPos}>{row.position}</Text>
                    <Text style={styles.lbName}>{row.name}</Text>
                    <Text style={styles.lbXp}>{row.xp} XP</Text>
                  </View>
                ))
              )}
            </View>
            <View style={[styles.leaderboardBox,{ marginTop:14 }]}> 
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <Text style={styles.sectionTitle}>Misiones de hoy</Text>
                <Text onPress={() => (router as any).push('/tabs/misiones')} style={{ color:'#0a7ea4', fontWeight:'600' }}>Ver misiones</Text>
              </View>
              {missions.length === 0 ? (
                <Text style={styles.emptyText}>Se generarán al iniciar el día.</Text>
              ) : (
                missions.slice(0,2).map(m => (
                  <View key={m.id} style={{ marginBottom:8 }}>
                    <MissionCard mission={m} />
                  </View>
                ))
              )}
              <Text style={{ marginTop:4, fontSize:12, color:'#555' }}>Progreso global misiones: {Math.round(progressRatio*100)}% {allCompleted ? '✔' : ''}</Text>
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
          ) : null
        )}
        renderItem={({ item, section }) => (
          section.type === 'modules' ? (
            <ProgressCard
              title={item.nombre}
              learned={item.learned}
              total={item.total}
              onPress={() => router.push({ pathname: '/tabs/Modulos_Alumno/modulo_detalle', params: { id: String(item.id) } })}
            />
          ) : (
            <HistorialItem
              nombre={item.senia_nombre}
              modulo={item.modulo_nombre}
              fechaISO={item.created_at}
            />
          )
        )}
      />
    </SafeAreaView>
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
  leaderboardBox: { marginTop: 10, backgroundColor: '#fff', borderRadius: 10, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  lbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  lbPos: { width: 28, textAlign: 'center', fontWeight: 'bold', color: '#0a7ea4' },
  lbName: { flex: 1, marginLeft: 6, color: '#222' },
  lbXp: { marginLeft: 8, fontWeight: '600', color: '#20bfa9' },
});
