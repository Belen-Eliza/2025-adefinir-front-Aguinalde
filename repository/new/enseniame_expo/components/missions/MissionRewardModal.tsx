import React, { useEffect } from 'react';
import { Modal, View, Text } from 'react-native';
import { ProgressBarAnimada } from '../animations/ProgressBarAnimada';
import ConfettiBurst from '../animations/ConfettiBurst';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Mission } from '../../conexiones/misiones';

export function MissionRewardModal({ visible, onClose, mission, allComplete }: { visible: boolean; onClose: () => void; mission?: Mission; allComplete?: boolean }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent:'center', alignItems:'center' }}>
        <Animated.View style={[{ backgroundColor:'#fff', width:'80%', borderRadius:24, padding:20, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:14 }, style]}>
          <Text style={{ fontSize:20, fontWeight:'700', color:'#222', marginBottom:8 }}>{allComplete ? '¡Todas las misiones completadas!' : '¡Misión completada!'}</Text>
          {mission && (
            <>
              <Text style={{ fontSize:16, fontWeight:'600', color:'#20bfa9' }}>+{mission.xp_reward} XP • +{mission.coin_reward} monedas</Text>
              <Text style={{ marginTop:8, color:'#555' }}>Recompensa por: {mission.mission_type}</Text>
            </>
          )}
          {allComplete && <Text style={{ marginTop:8, fontWeight:'600', color:'#ff9800' }}>Bonus diario aplicado</Text>}
          <Text onPress={onClose} style={{ marginTop:18, alignSelf:'flex-end', fontWeight:'600', color:'#0a7ea4' }}>Cerrar</Text>
        </Animated.View>
        { (mission || allComplete) && <ConfettiBurst visible={visible} onDone={()=>{}} /> }
      </View>
    </Modal>
  );
}
