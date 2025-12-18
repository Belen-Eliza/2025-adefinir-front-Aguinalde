import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { SmallPopupModal } from '@/components/modals';

type Mensual = { label: string; anio: number; mes: number; cantidad: number };
type ModComp = { id: number; nombre: string; fecha: string };
type ObjetivoPersonal = { id?: number; user_id: number; mes: number; 
                          anio: number; meta_mensual: number; 
                          progreso_actual: number; completado: boolean };

export default function ReporteHistoricoScreen() {
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [series, setSeries] = useState<Mensual[]>([]);
  const [modulosCompletados, setModulosCompletados] = useState<ModComp[]>([]);

  const [objetivo, setObjetivo] = useState<ObjetivoPersonal | null>(null);
  const [modalObjetivo, setModalObjetivo] = useState(false);
  const [metaInput, setMetaInput] = useState('');

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1; // 1..12
  const anioActual = ahora.getFullYear();

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // 1) Señás aprendidas por mes
      // Intentar seleccionar con updated_at; si no existe la columna, reintentar sin ella
      let aprendidas: any[] = [];
      {
        const tryWithUpd = await supabase
          .from('Alumno_Senia')
          .select('senia_id, aprendida, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('aprendida', true)
          .order('created_at', { ascending: true });
        if (tryWithUpd.error) {
          const tryWithoutUpd = await supabase
            .from('Alumno_Senia')
            .select('senia_id, aprendida, created_at')
            .eq('user_id', user.id)
            .eq('aprendida', true)
            .order('created_at', { ascending: true });
          if (tryWithoutUpd.error) throw tryWithoutUpd.error;
          aprendidas = tryWithoutUpd.data || [];
        } else {
          aprendidas = tryWithUpd.data || [];
        }
      }

      // Agrupar por mes/año
      const map = new Map<string, number>();
      (aprendidas || []).forEach((r: any) => {
        const d = new Date(r.updated_at || r.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()+1}`;
        map.set(key, (map.get(key) || 0) + 1);
      });

      // Tomar últimos 6 meses
      const puntos: Mensual[] = [];
      for (let i = 5; i >= 0; i--) {
        const dt = new Date();
        dt.setMonth(dt.getMonth() - i);
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        const key = `${y}-${m}`;
        const cantidad = map.get(key) || 0;
        const label = `${('0'+m).slice(-2)}/${String(y).slice(-2)}`;
        puntos.push({ label, anio: y, mes: m, cantidad });
      }
      setSeries(puntos);

      // 2) Módulos completados (todos sus videos aprendidos)
      const { data: mods, error: modErr } = await supabase
        .from('Modulos')
        .select('id, nombre');
      if (modErr) throw modErr;
      const { data: rels, error: relErr } = await supabase
        .from('Modulo_Video')
        .select('id_modulo, id_video');
      if (relErr) throw relErr;

      // Mapear aprendidas por senia_id -> created_at
      const aprendidaFecha = new Map<number, string>();
      (aprendidas || []).forEach((r: any) => {
        const sid = Number(r.senia_id);
        const prev = aprendidaFecha.get(sid);
        const ca = String(r.updated_at || r.created_at);
        // quedarnos con la fecha más reciente (o primera)
        if (!prev || new Date(ca) > new Date(prev)) aprendidaFecha.set(sid, ca);
      });

      // Calcular completados: todos los videos del módulo aprendidos
      const vidsPorModulo = new Map<number, number[]>();
      (rels || []).forEach((r: any) => {
        const arr = vidsPorModulo.get(Number(r.id_modulo)) || [];
        arr.push(Number(r.id_video));
        vidsPorModulo.set(Number(r.id_modulo), arr);
      });

      const completados: ModComp[] = [];
      (mods || []).forEach((m: any) => {
        const vids = vidsPorModulo.get(Number(m.id)) || [];
        if (vids.length === 0) return;
        const allLearned = vids.every((v) => aprendidaFecha.has(v));
        if (allLearned) {
          // fecha finalización = max(created_at de las señas del módulo)
          let maxDate = '';
          vids.forEach((v) => {
            const d = aprendidaFecha.get(v) || '';
            if (!maxDate || (d && new Date(d) > new Date(maxDate))) maxDate = d;
          });
          completados.push({ id: Number(m.id), nombre: String(m.nombre), fecha: maxDate });
        }
      });
      // ordenar por fecha desc
      completados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setModulosCompletados(completados);

      // 3) Objetivo mensual del usuario (tabla objetivos_personales)
      try {
        const { data: objs, error: objErr } = await supabase
          .from('objetivos_personales')
          .select('*')
          .eq('user_id', user.id)
          .eq('mes', mesActual)
          .eq('anio', anioActual)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (objErr) throw objErr;

        const obj = Array.isArray(objs) && objs.length > 0 ? objs[0] : null;
        const progreso = puntos.find((p) => p.anio === anioActual && p.mes === mesActual)?.cantidad || 0;
        if (obj) {
          const comp = Number(obj.meta_mensual) > 0 && progreso >= Number(obj.meta_mensual);
          setObjetivo({
            id: Number(obj.id),
            user_id: Number(user.id),
            mes: Number(mesActual),
            anio: Number(anioActual),
            meta_mensual: Number(obj.meta_mensual || 0),
            progreso_actual: progreso,
            completado: !!(obj.completado ?? comp),
          });

          // actualizar en background si cambió progreso/completado
          try {
            await supabase
              .from('objetivos_personales')
              .update({ progreso_actual: progreso, completado: comp })
              .eq('id', obj.id);
          } catch {}
        } else {
          // no hay objetivo creado aún
          setObjetivo({ user_id: Number(user.id), mes: Number(mesActual), anio: Number(anioActual), meta_mensual: 0, progreso_actual: progreso, completado: false });
        }
      } catch (e: any) {
        // Si no existe tabla o hay múltiples filas sin UNIQUE, no bloqueamos el reporte
        console.warn('[reporte] objetivos_personales no disponible/duplicado:', e?.message);
        const progreso = (puntos.find((p) => p.anio === anioActual && p.mes === mesActual)?.cantidad) || 0;
        setObjetivo({ user_id: Number(user.id), mes: Number(mesActual), anio: Number(anioActual), meta_mensual: 0, progreso_actual: progreso, completado: false });
      }
    } catch (e: any) {
      console.error('[reporte] fetch error:', e?.message);
      setError('No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: nuevas señas aprendidas refrescan
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`rt-reporte-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Alumno_Senia', filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [user?.id, fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const openObjetivoModal = () => {
    setMetaInput(objetivo?.meta_mensual ? String(objetivo.meta_mensual) : '');
    setModalObjetivo(true);
  };

  const saveObjetivo = async () => {
    if (!user?.id) return;
    const meta = Math.max(0, parseInt(metaInput || '0', 10) || 0);
    const progreso = series.find((p) => p.anio === anioActual && p.mes === mesActual)?.cantidad || 0;
    const comp = meta > 0 && progreso >= meta;
    try {
      // Upsert asegura creación/actualización en una sola operación (evita conflictos por UNIQUE)
      const { data, error } = await supabase
        .from('objetivos_personales')
        .upsert({ user_id: user.id, mes: mesActual, anio: anioActual, meta_mensual: meta, progreso_actual: progreso, completado: comp }, { onConflict: 'user_id,mes,anio' })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setObjetivo({ id: data.id, user_id: user.id, mes: mesActual, anio: anioActual, meta_mensual: meta, progreso_actual: progreso, completado: comp });
      }
      setModalObjetivo(false);
      // refresh objetivo
      fetchAll();
      Alert.alert('Objetivo guardado', 'Tu objetivo mensual fue guardado correctamente.');
    } catch (e: any) {
      console.error('[reporte] save objetivo error:', e?.message);
      Alert.alert('Error', 'No se pudo guardar tu objetivo. Verifica tu conexión o permisos.');
    }
  };

  const pct = useMemo(() => {
    if (!objetivo) return 0;
    const total = objetivo.meta_mensual || 0;
    const act = objetivo.progreso_actual || 0;
    return total > 0 ? Math.min(100, Math.round((act / total) * 100)) : 0;
  }, [objetivo]);

  const Chart = () => {
    const max = Math.max(1, ...series.map((s) => s.cantidad));
    return (
      <View style={styles.chartBox}>
        <Text style={styles.sectionTitle}>Señas aprendidas por mes</Text>
        <View style={styles.chartArea}>
          {series.map((s, idx) => (
            <View key={`${s.anio}-${s.mes}-${idx}`} style={styles.barCol}>
              <View style={[styles.bar, { height: `${(s.cantidad / max) * 100}%` }]} />
              <Text style={styles.barLabel}>{s.label}</Text>
              <Text style={styles.barValue}>{s.cantidad}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
          <ActivityIndicator size="large" color="#20bfa9" />
          <Text style={{ marginTop: 12, color: '#555' }}>Cargando reporte…</Text>
        </View>
      ) : (
        <FlatList
          data={modulosCompletados}
          keyExtractor={(it) => String(it.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <View style={styles.headerBox}>
              <Text style={styles.title}>Reporte histórico</Text>
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                  <Text style={styles.errorText}> {error} </Text>
                </View>
              )}
              {/* Chart */}
              <Chart />
              {/* Objetivo mensual */}
              <View style={styles.objCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.sectionTitle}>Objetivo del mes</Text>
                  <TouchableOpacity onPress={openObjetivoModal}>
                    <Ionicons name="pencil" size={18} color="#0a7ea4" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.objSubtitle}>{objetivo?.progreso_actual || 0}/{objetivo?.meta_mensual || 0} señas</Text>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
                <Text style={styles.progressPercent}>{pct}% {objetivo?.completado ? '🎉 Objetivo logrado' : ''}</Text>
              </View>
              {/* Título de módulos */}
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Módulos completados</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
              <Text style={styles.cardDate}>Finalizado: {new Date(item.fecha).toLocaleDateString()}</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Aún no completaste módulos.</Text>
          )}
        />
      )}

      {/* Modal objetivo */}
      <SmallPopupModal title={'Objetivo mensual'} modalVisible={modalObjetivo} setVisible={setModalObjetivo}>
        <View>
          <Text style={styles.modalLabel}>Cantidad de señas para {('0'+mesActual).slice(-2)}/{anioActual}</Text>
          <TextInput value={metaInput} onChangeText={setMetaInput} keyboardType='number-pad' placeholder='20' style={styles.input} />
          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={saveObjetivo}>
            <Ionicons name='save' size={18} color='#fff' />
            <Text style={styles.btnSaveText}>Guardar objetivo</Text>
          </TouchableOpacity>
        </View>
      </SmallPopupModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7f2' },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  headerBox: { paddingHorizontal: 18, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#222', marginTop: 60, marginBottom: 28, alignSelf: 'center', letterSpacing: 0.5 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 10, borderWidth: 1, borderColor: '#f5c2c0' },
  errorText: { color: '#e74c3c', marginLeft: 6 },
  emptyText: { color: '#777', alignSelf: 'center', marginVertical: 12 },

  chartBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#222', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, marginTop: 8 },
  barCol: { alignItems: 'center', width: 42 },
  bar: { width: 24, backgroundColor: '#20bfa9', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel: { marginTop: 6, fontSize: 11, color: '#555' },
  barValue: { fontSize: 12, color: '#222', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },

  objCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#222', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  objSubtitle: { color: '#555', marginTop: 6 },
  progressBar: { height: 12, backgroundColor: '#e9f7f4', borderRadius: 8, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#20bfa9', borderRadius: 8 },
  progressPercent: { alignSelf: 'flex-end', color: '#20bfa9', fontWeight: 'bold', marginTop: 6 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#222', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { color: '#222', fontSize: 16, fontWeight: 'bold' },
  cardDate: { color: '#555', marginTop: 4 },

  modalLabel: { color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  btn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  saveBtn: { backgroundColor: '#20bfa9' },
  btnSaveText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
});
