import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

// Estructura de objetivo activo esperada en BD
export type ObjetivoActivo = {
  id: number;
  user_id: number;
  titulo: string;
  descripcion?: string | null;
  tipo?: string | null; // p. ej. 'modulos' | 'senias' | 'custom'
  meta_total: number; // meta objetivo
  valor_actual: number; // progreso actual
  estado: 'activo' | 'completado' | 'pausado' | string;
  updated_at?: string | null;
};

export default function ObjetivosActivosScreen() {
  const { user } = useUserContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ObjetivoActivo[]>([]);

  const fetchObjetivos = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    try {
      // Traer todas las columnas disponibles para hacer el feature compatible con esquemas previos
      const { data, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;

      // Filtrar activos: usar 'estado' si existe, sinó usar 'completado'
      const rows = ((data as any[]) || []).filter((r) => {
        if (typeof r.estado !== 'undefined' && r.estado !== null) {
          return String(r.estado).toLowerCase() !== 'completado';
        }
        if (typeof r.completado !== 'undefined') {
          return !r.completado;
        }
        return true; // si no hay ninguna de las dos, se considera activo
      });

      const list: ObjetivoActivo[] = rows.map((r) => ({
        id: Number(r.id),
        user_id: Number(r.user_id),
        titulo: String(r.titulo),
        descripcion: r.descripcion ?? null,
        tipo: r.tipo ?? null,
        meta_total: Number(r.meta_total ?? 0),
        valor_actual: Number(r.valor_actual ?? 0),
        estado: (r.estado as any) ?? (r.completado ? 'completado' : 'activo'),
        updated_at: r.updated_at ?? null,
      }));

      // Auto-completar si corresponde
      const toComplete = list.filter((o) => (o.meta_total ?? 0) > 0 && o.valor_actual >= o.meta_total && o.estado !== 'completado');
      if (toComplete.length) {
        // Actualizamos en background, sin bloquear UI
        try {
          const ids = toComplete.map((o) => o.id);
          // Intentar setear estado. Si falla por columna inexistente, intentar 'completado = true'
          const { error: upErr } = await supabase.from('objetivos').update({ estado: 'completado' }).in('id', ids);
          if (upErr) {
            await supabase.from('objetivos').update({ completado: true }).in('id', ids);
          }
        } catch (e) {
          // silencioso: no bloquea
          console.warn('[objetivos_activos] no se pudo autocompletar:', (e as any)?.message);
        }
      }

      setItems(list);
    } catch (e: any) {
      console.error('[objetivos_activos] fetch error:', e?.message);
      setError('No se pudieron cargar tus objetivos activos. Verifica tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchObjetivos();
  }, [fetchObjetivos]);

  // Suscripción en tiempo real a cambios relacionados
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`rt-objetivos-activos-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Alumno_Senia', filter: `user_id=eq.${user.id}` },
        () => fetchObjetivos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objetivos', filter: `user_id=eq.${user.id}` },
        () => fetchObjetivos()
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [user?.id, fetchObjetivos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchObjetivos();
  };

  const renderItem = ({ item }: { item: ObjetivoActivo }) => {
    const total = item.meta_total || 0;
    const actual = Math.max(0, Math.min(item.valor_actual || 0, total || 0));
    const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

    const icon = (item.tipo || '').toLowerCase().includes('seña') ? 'hand-left' : 'trophy';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Ionicons name={icon as any} size={20} color="#20bfa9" style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>{item.titulo}</Text>
          </View>
          {pct >= 100 && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.badgeText}>Completado</Text>
            </View>
          )}
        </View>

        {item.descripcion ? <Text style={styles.desc}>{item.descripcion}</Text> : null}

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressText}>{actual} de {total} completados ({pct}%)</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#20bfa9" />
          <Text style={{ marginTop: 12, color: '#555' }}>Cargando objetivos activos…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={() => (
            <View style={styles.headerBox}>
              <Text style={styles.title}>Objetivos activos</Text>
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                  <Text style={styles.errorText}> {error} </Text>
                </View>
              )}
            </View>
          )}
          ListHeaderComponentStyle={{ paddingHorizontal: 18 }}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No tenés objetivos activos por ahora.</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7f2' },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  headerBox: { paddingBottom: 8 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 60,
    marginBottom: 28,
    alignSelf: 'center',
    letterSpacing: 0.5,
  },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 10, borderWidth: 1, borderColor: '#f5c2c0' },
  errorText: { color: '#e74c3c', marginLeft: 6 },
  emptyText: { color: '#777', alignSelf: 'center', marginVertical: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: '#222', fontSize: 18, fontWeight: 'bold' },
  desc: { color: '#555', marginTop: 6 },
  progressBar: { height: 12, backgroundColor: '#e9f7f4', borderRadius: 8, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', backgroundColor: '#20bfa9', borderRadius: 8 },
  progressText: { alignSelf: 'flex-end', color: '#20bfa9', fontWeight: 'bold', marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#20bfa9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  badgeText: { color: '#fff', marginLeft: 4, fontWeight: '600' },
});
