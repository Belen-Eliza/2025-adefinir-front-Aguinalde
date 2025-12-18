import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useUserContext } from '../../../context/UserContext';
import { useDailyMissions } from '../../../hooks/useDailyMissions';
import { MissionCard } from '../../../components/missions/MissionCard';
import { MissionRewardModal } from '../../../components/missions/MissionRewardModal';
import ConfettiBurst from '../../../components/animations/ConfettiBurst';
import { AnimatedButton } from '../../../components/animations/AnimatedButton';

export default function MisionesDiariasScreen() {
  const { user } = useUserContext();
  const { missions, loading, progressRatio, allCompleted, streakFull } = useDailyMissions(user?.id);
  const schemaMissing = !loading && missions.length === 0; // podría ser porque no hay generación o falta migración
  const [showReward, setShowReward] = useState(false);
  const [recentMission, setRecentMission] = useState<any>(null);

  useEffect(() => {
    if (allCompleted) {
      setRecentMission(null);
      setShowReward(true);
    }
  }, [allCompleted]);

  const onMissionPress = (m: any) => {
    if (m.status === 'completed') {
      setRecentMission(m);
      setShowReward(true);
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:'#e6f7f2', paddingTop:60 }}>
      <ScrollView contentContainerStyle={{ padding:20, paddingBottom:100 }}>
        <Text style={{ fontSize:30, fontWeight:'700', color:'#222', marginBottom:12, alignSelf:'center' }}>Misiones Diarias</Text>
        {loading && <ActivityIndicator color="#20bfa9" style={{ marginVertical:20 }} />}
        <Text style={{ fontSize:14, color:'#555', marginBottom:8 }}>Progreso global: {Math.round(progressRatio*100)}%</Text>
        <View style={{ flexDirection:'row', marginBottom:14 }}>
          <Text style={{ fontWeight:'600', color:'#20bfa9' }}>Streak días completos: {streakFull}</Text>
        </View>
        {missions.map(m => (
          <MissionCard key={m.id} mission={m} onPress={onMissionPress} />
        ))}
        {missions.length === 0 && !loading && (
          <View style={{ marginTop:20, backgroundColor:'#fff', padding:16, borderRadius:14 }}>
            <Text style={{ fontWeight:'600', color:'#e67e22', marginBottom:6 }}>No hay misiones cargadas.</Text>
            <Text style={{ color:'#555', fontSize:13 }}>Si esperabas ver misiones, verificá que se haya aplicado la migración SQL: 2025-11-26_daily_missions.sql en Supabase (supabase db push) y que la función generate_daily_missions y la vista vw_today_missions existan.</Text>
          </View>
        )}
        {allCompleted && (
          <View style={{ marginTop:16, backgroundColor:'#fff', padding:16, borderRadius:14 }}>
            <Text style={{ fontWeight:'700', color:'#ff9800' }}>¡Bonus por todas las misiones!</Text>
            <Text style={{ marginTop:4, color:'#555' }}>Has completado todas las misiones de hoy. Vuelve mañana para más desafíos.</Text>
          </View>
        )}
        <AnimatedButton title="Refrescar" onPress={() => { /* Hook ya se suscribe; se podría forzar recarga futura */ }} style={{ marginTop:24 }} />
      </ScrollView>
      <MissionRewardModal visible={showReward} onClose={() => setShowReward(false)} mission={recentMission} allComplete={recentMission==null && allCompleted} />
      {allCompleted && <ConfettiBurst visible={true} onDone={() => {}} />}
    </View>
  );
}
