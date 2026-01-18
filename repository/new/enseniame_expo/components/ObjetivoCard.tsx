import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Objetivo = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: Date | null;
  completado: boolean;
}

export default function ObjetivoCard({
  objetivo,
  onEdit,
  onDelete,
  onToggle,
}: {
  objetivo: Objetivo;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const fechaText = objetivo.fecha_limite ? new Date(objetivo.fecha_limite).toLocaleDateString() : null;

  return (
    <View style={[styles.card, objetivo.completado && styles.cardCompleted]}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
          {objetivo.completado ? (
            <Ionicons name="checkmark-circle" size={22} color="#0a7ea4" />
          ) : (
            <Ionicons name="ellipse-outline" size={22} color="#888" />
          )}
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, objetivo.completado && styles.tituloCompleted]} numberOfLines={1}>{objetivo.titulo}</Text>
          {objetivo.descripcion ? <Text style={styles.desc} numberOfLines={2}>{objetivo.descripcion}</Text> : null}
          {fechaText ? <Text style={styles.fecha}>Fecha límite: {fechaText}</Text> : null}
        </View>
      </View>

      <View style={styles.actions}>
        {!objetivo.completado && (
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
            <Ionicons name="pencil" size={18} color="#0a7ea4" />
          </TouchableOpacity>
        )}

        {!objetivo.completado && (
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Ionicons name="trash" size={18} color="#d9534f" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  cardCompleted: {
    backgroundColor: '#f6fffb',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 10, paddingTop: 2 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  tituloCompleted: { textDecorationLine: 'line-through', color: '#666' },
  desc: { marginTop: 4, color: '#666' },
  fecha: { marginTop: 6, color: '#888', fontSize: 12 },
  actions: { position: 'absolute', right: 8, top: 8, flexDirection: 'row' },
  actionBtn: { marginLeft: 8, padding: 6 },
});
