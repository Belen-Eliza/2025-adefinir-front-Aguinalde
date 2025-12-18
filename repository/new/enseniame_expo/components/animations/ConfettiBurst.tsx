import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, runOnJS } from 'react-native-reanimated';

// Pequeño burst de confetti (sin librerías externas) para refuerzo dopaminérgico.
// Genera N partículas que suben y se desvanecen.

interface ConfettiBurstProps {
  visible: boolean;
  onDone?: () => void;
  colors?: string[];
  particleCount?: number;
  durationMs?: number;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  visible,
  onDone,
  colors = ['#ff9800', '#ffc107', '#ff5722', '#ffd54f', '#ffb300', '#9c27b0', '#03a9f4', '#4caf50'],
  particleCount = 48,
  durationMs = 1300,
}) => {
  const done = React.useRef(false);
  const items = React.useMemo(() => (
    Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      leftPct: 2 + Math.random() * 96,
      size: 5 + Math.random() * 12,
      color: colors[i % colors.length],
      yOffset: 80 + Math.random() * 120,
      delay: Math.random() * 220,
    }))
  ), [particleCount, colors]);

  // Cuando visible cambia a true, al terminar animaciones llamar onDone.
  React.useEffect(() => {
    if (!visible) return;
    done.current = false;
    const t = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        onDone && onDone();
      }
    }, durationMs + 300);
    return () => clearTimeout(t);
  }, [visible, durationMs, onDone]);

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {items.map(p => (
        <Particle
          key={p.id}
          {...p}
          durationMs={durationMs}
          onLast={() => {
            if (!done.current) { done.current = true; onDone && onDone(); }
          }}
        />
      ))}
    </View>
  );
};

interface ParticleProps {
  id: number;
  leftPct: number;
  size: number;
  color: string;
  yOffset: number;
  delay: number;
  durationMs: number;
  onLast: () => void;
}

const Particle: React.FC<ParticleProps> = ({ leftPct, size, color, yOffset, delay, durationMs, onLast, id }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  React.useEffect(() => {
    const rise = 280 + Math.random() * 420; // subir más alto para full screen
    const drift = (Math.random() - 0.5) * 40; // leve deriva horizontal
    translateY.value = withDelay(delay, withSequence(
      withTiming(-rise - yOffset, { duration: durationMs }),
    ));
    translateX.value = withDelay(delay, withSequence(
      withTiming(drift, { duration: durationMs })
    ));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: durationMs })
    ));
    scale.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 160 }),
      withTiming(0.3, { duration: durationMs })
    ));
    // El último particle dispara onLast
    if (id === 0) {
      setTimeout(() => { runOnJS(onLast)(); }, durationMs + delay + 180);
    }
  }, [delay, durationMs, yOffset, onLast, id, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.particle, animatedStyle, { left: `${leftPct}%`, width: size, height: size, backgroundColor: color }]} />;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  particle: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 12,
  },
});

export default ConfettiBurst;
