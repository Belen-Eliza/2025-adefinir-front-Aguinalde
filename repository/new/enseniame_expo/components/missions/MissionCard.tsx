import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { Mission } from '../../conexiones/misiones';
import { ProgressBarAnimada } from '../animations/ProgressBarAnimada';

export function MissionCard({ mission, onPress }: { mission: Mission; onPress?: (m: Mission) => void }) {
  const glow = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (mission.status === 'completed') {
      glow.value = withTiming(1, { duration: 400 });
      pop.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 300 })
      );
    } else {
      glow.value = withTiming(0, { duration: 250 });
    }
  }, [mission.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.08 }],
    shadowColor: mission.status === 'completed' ? '#20bfa9' : '#000',
    shadowOpacity: mission.status === 'completed' ? 0.35 * glow.value : 0.08,
    shadowRadius: mission.status === 'completed' ? 14 * glow.value : 6,
  }));

  const ratio = mission.target_value ? mission.current_value / mission.target_value : 0;
  const pct = Math.round(ratio * 100);

  const labelMap: Record<string,string> = {
    LEARN_SIGNS: 'Aprender señas',
    COMPLETE_MODULE: 'Completar módulo',
    PLAY_MC_GAME: 'Partida Multiple Choice',
    MAINTAIN_STREAK: 'Mantener racha',
    CORRECT_ANSWERS: 'Respuestas correctas'
  };

  return (
    <Pressable onPress={() => onPress && onPress(mission)}>
      <Animated.View style={[{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#e0e0e0' }, animatedStyle]}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: '#222', marginBottom: 6 }}>{labelMap[mission.mission_type] || mission.mission_type}</Text>
        <ProgressBarAnimada progress={pct} />
        <Text style={{ marginTop: 4, color: '#555', fontWeight: '600' }}>{mission.current_value}/{mission.target_value} • {pct}%</Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: mission.status === 'completed' ? '#20bfa9' : '#777' }}>{mission.status === 'completed' ? 'Completada ✔' : 'Activa'}</Text>
        {mission.status === 'completed' && (
          <Text style={{ marginTop: 6, color: '#20bfa9', fontWeight: '700' }}>+{mission.xp_reward} XP • +{mission.coin_reward} monedas</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
