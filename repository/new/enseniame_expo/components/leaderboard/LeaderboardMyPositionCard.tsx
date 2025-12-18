import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LeaderboardEntry } from './types';

interface Props { selfEntry?: LeaderboardEntry; }

export const LeaderboardMyPositionCard: React.FC<Props> = ({ selfEntry }) => {
  if (!selfEntry) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tu Posición</Text>
      <Text style={styles.line}>Posición: {selfEntry.position}</Text>
      <Text style={styles.line}>XP: {selfEntry.xp ?? 0}</Text>
      <Text style={styles.line}>Señas aprendidas: {selfEntry.signsLearned ?? 0}</Text>
      <Text style={styles.line}>Módulos completados: {selfEntry.modulesCompleted ?? 0}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  line: { fontSize: 13, color: '#444', marginTop: 2 },
});
