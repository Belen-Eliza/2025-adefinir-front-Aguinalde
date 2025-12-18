import React from 'react';
import { Modal, View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useGamifiedFeedback } from './useGamifiedFeedback';

export function SuccessModal({ visible, title, subtitle, onClose }: { visible: boolean; title: string; subtitle?: string; onClose: () => void }) {
  const { celebrate } = useGamifiedFeedback();

  React.useEffect(() => { if (visible) celebrate('success'); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View entering={ZoomIn} exiting={ZoomOut} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '80%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6 }}>{title}</Text>
          {subtitle ? <Text style={{ color: '#555', marginBottom: 12 }}>{subtitle}</Text> : null}
          <Text onPress={onClose} style={{ color: '#0a7ea4', alignSelf: 'flex-end', fontWeight: '600' }}>Cerrar</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
