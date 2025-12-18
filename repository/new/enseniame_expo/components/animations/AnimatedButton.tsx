import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useGamifiedFeedback } from './useGamifiedFeedback';

export function AnimatedButton({ title, onPress, style, textStyle }: { title: string; onPress: () => void; style?: ViewStyle; textStyle?: TextStyle }) {
  const scale = useSharedValue(1);
  const { vibrate } = useGamifiedFeedback();

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, style]}> 
      <Pressable
        onPress={() => { vibrate('success'); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.98, { stiffness: 180, damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 180, damping: 18 }); }}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <Text style={textStyle}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}
