import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useUserContext } from '@/context/UserContext';
import ObjetivoCard from '@/components/ObjetivoCard';
import ObjetivoModal from '@/components/ObjetivoModal';
import { Ionicons } from '@expo/vector-icons';
import { paleta } from '@/components/colores';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ganar_insignia_objetivos } from '@/conexiones/insignias';

type Objetivo = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  completado: boolean;
  user_id?: number;
}

export default function AlumnoObjetivosScreen() {
  const { user } = useUserContext();
  const tabBarHeight = useBottomTabBarHeight();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Objetivo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reload when the logged user changes (fixes empty list after login)
  useEffect(() => {
    if ((user as any)?.id && (user as any).id !== 0) {
      loadObjetivos();
    }
  }, [(user as any)?.id]);

  async function loadObjetivos() {
    try {
      setLoading(true);
      setError(null);
      const uid = (user as any)?.id;
      console.log('[Objetivos] Loading for user id:', uid);
      const { data, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq('user_id', uid);

      if (error) throw error;
      const list: Objetivo[] = (data || []).map((r: any) => ({
        id: r.id,
        titulo: r.titulo,
        descripcion: r.descripcion,
        fecha_limite: r.fecha_limite,
        completado: r.completado,
        user_id: r.user_id,
      }));

      // sort by fecha_limite (closest first). nulls last
      list.sort((a, b) => {
        if (!a.fecha_limite && !b.fecha_limite) return 0;
        if (!a.fecha_limite) return 1;
        if (!b.fecha_limite) return -1;
        return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
      });

  console.log('[Objetivos] Loaded count:', list.length);
  setObjetivos(list);
    } catch (err: any) {
      console.error(err);
      setError('Error cargando objetivos');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadObjetivos();
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (o: Objetivo) => {
    if (o.completado) {
      Alert.alert('No permitido', 'No se puede editar un objetivo completado');
      return;
    }
    setEditing(o);
    setModalVisible(true);
  };

  const handleSave = async (payload: Partial<Objetivo> & { id?: number }) => {
    try {
      setLoading(true);
      if (payload.id) {
        // update
        const { data, error } = await supabase
          .from('objetivos')
          .update({ titulo: payload.titulo, descripcion: payload.descripcion, fecha_limite: payload.fecha_limite })
          .eq('id', payload.id)
          .select();
        if (error) throw error;
      } else {
        // create
        const { data, error } = await supabase
          .from('objetivos')
          .insert([{ titulo: payload.titulo, descripcion: payload.descripcion, fecha_limite: payload.fecha_limite, completado: false, user_id: (user as any).id }])
          .select();
        if (error) throw error;
      }
      setModalVisible(false);
      await loadObjetivos();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar el objetivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (o: Objetivo) => {
    if (o.completado) {
      Alert.alert('No permitido', 'No se puede eliminar un objetivo completado');
      return;
    }
    Alert.alert('Confirmar', '¿Eliminar objetivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => confirmDelete(o) },
    ]);
  };

  const confirmDelete = async (o: Objetivo) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('objetivos').delete().eq('id', o.id);
      if (error) throw error;
      await loadObjetivos();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo eliminar el objetivo');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (o: Objetivo) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('objetivos').update({ completado: !o.completado }).eq('id', o.id);
      if (error) throw error;
      await loadObjetivos();
      ganar_insignia_objetivos(user.id);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={objetivos}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={styles.title}>Mis Objetivos</Text>
            {loading && (
              <View style={{ alignItems: 'center', marginTop: 6 }}>
                <ActivityIndicator size="small" color="#20bfa9" />
              </View>
            )}
            {error && <Text style={{ color: '#e74c3c', alignSelf: 'center', marginTop: 8 }}>{error}</Text>}

            {/* Mini progreso de objetivos */}
            <View style={styles.progressCard}>
              <Text style={styles.progressHeader}>Progreso de objetivos</Text>
              <Text style={styles.progressTotal}>
                {objetivos.filter(o => o.completado).length}/{objetivos.length} objetivos
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${objetivos.length > 0 ? Math.min(Math.round((objetivos.filter(o => o.completado).length / objetivos.length) * 100), 100) : 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>
                {objetivos.length > 0 ? Math.round((objetivos.filter(o => o.completado).length / objetivos.length) * 100) : 0}%
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ObjetivoCard
            objetivo={item}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
            onToggle={() => toggleComplete(item)}
          />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={styles.empty}>No tienes objetivos aún</Text>
            <TouchableOpacity onPress={openCreate} style={{ marginTop: 12, backgroundColor: paleta.blue, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Crear tu primer objetivo</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 120 }]}
      />

      <TouchableOpacity style={[styles.fab, { bottom: tabBarHeight + 16 }]} onPress={openCreate}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <ObjetivoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        initialData={editing || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7f2' },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  headerBox: { paddingTop: 52, paddingBottom: 8 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    alignSelf: 'center',
    letterSpacing: 0.5,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#222',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressHeader: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  progressTotal: { color: '#555', marginBottom: 8 },
  progressBar: { height: 12, backgroundColor: '#e9f7f4', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#20bfa9', borderRadius: 8 },
  progressPercent: { alignSelf: 'flex-end', color: '#20bfa9', fontWeight: 'bold', marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#0a7ea4',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 5,
  },
});
