import React from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function AnimatedCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const glow = useSharedValue(0);

  React.useEffect(() => {
    glow.value = 1;
    const t = setTimeout(() => { glow.value = 0; }, 600);
    return () => clearTimeout(t);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: withTiming(glow.value ? 0.18 : 0.08, { duration: 300 }),
    shadowRadius: withTiming(glow.value ? 18 : 12, { duration: 300 }),
  }));

  return (
    <Animated.View style={[animatedStyle, style]}> 
      <View>{children}</View>
    </Animated.View>
  );
}
