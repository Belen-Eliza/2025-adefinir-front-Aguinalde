import React from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function ProgressBarAnimada({ progress, style }: { progress: number; style?: ViewStyle }) {
  const width = useSharedValue(0);
  React.useEffect(() => {
    width.value = progress;
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({ width: withTiming(`${Math.max(0, Math.min(100, width.value))}%`, { duration: 400 }) }));

  return (
    <View style={[{ width: '100%', height: 12, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height: '100%', backgroundColor: '#20bfa9', borderRadius: 6 }, animatedStyle]} />
    </View>
  );
}
