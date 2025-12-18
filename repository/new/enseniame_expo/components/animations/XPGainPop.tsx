import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';

export function XPGainPop({ amount, onDone }: { amount: number; onDone?: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  useEffect(() => {
    if (amount <= 0) return;
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 300 })
    );
    translateY.value = withSequence(
      withTiming(-10, { duration: 400 }),
      withTiming(-30, { duration: 300 })
    );
    const t = setTimeout(() => { onDone && onDone(); }, 850);
    return () => clearTimeout(t);
  }, [amount]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  if (amount <= 0) return null;
  return (
    <Animated.View style={[{ position: 'absolute', right: 8, top: -4, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 }, style]}>
      <Text style={{ color: '#20bfa9', fontWeight: '700' }}>+{amount} XP</Text>
    </Animated.View>
  );
}
