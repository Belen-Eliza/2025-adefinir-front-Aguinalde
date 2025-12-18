import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LeaderboardEntry } from './types';

interface Props { entry: LeaderboardEntry; }

export const LeaderboardRow: React.FC<Props> = ({ entry }) => {
  const medal = entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : entry.position === 3 ? '🥉' : undefined;
  return (
    <View style={[styles.row, entry.isSelf && styles.selfHighlight]}>      
      <Text style={styles.pos}>{entry.position}</Text>
      <Text style={styles.name}>{medal ? medal + ' ' : ''}{entry.name}</Text>
      <View style={styles.stats}>        
        <Text style={styles.stat}>XP: {entry.xp ?? 0}</Text>
        <Text style={styles.stat}>Señas: {entry.signsLearned ?? 0}</Text>
        <Text style={styles.stat}>Mods: {entry.modulesCompleted ?? 0}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#fff', borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  selfHighlight: { borderWidth: 2, borderColor: '#20bfa9' },
  pos: { width: 34, fontWeight: 'bold', color: '#222' },
  name: { flex: 1, fontWeight: '600', color: '#222' },
  stats: { flexDirection: 'row', justifyContent: 'flex-end', flex: 1 },
  stat: { marginLeft: 12, fontSize: 12, color: '#555' },
});
