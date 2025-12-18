import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, ScrollView, ActivityIndicator, RefreshControl, StyleSheet, Image } from 'react-native';
import { useUserContext } from '@/context/UserContext';
import { PeriodSelector } from '@/components/leaderboard/PeriodSelector';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { LeaderboardMyPositionCard } from '@/components/leaderboard/LeaderboardMyPositionCard';
import { fetchGroupLeaderboard } from '@/conexiones/leaderboard';
import { getUserClub, getClubUsersProgress } from '@/conexiones/leaderboard_grupo_lectura';
import type { PeriodType, LeaderboardEntry, LeaderboardResponse } from '@/components/leaderboard/types';
import { supabase } from '@/lib/supabase';

export default function LeaderboardGrupoScreen() {
  const { user } = useUserContext();
  const [period, setPeriod] = useState<PeriodType>('week');
  // const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [clubUsers, setClubUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState<string>('');

  
  useEffect(() => {
    const fetchUserClubs = async () => {
      if (!user?.mail) return;
      const club = await getUserClub(user.mail);
      setGroupId(club);
    };
    fetchUserClubs();
  }, [user?.mail]);

  const load = useCallback(async () => {
    if (!user?.mail) return;
    setError(null);
    setLoading(true);
    try {
      // Obtener todos los usuarios del club para el ranking
      console.log('Cargando leaderboard para el club ID:', groupId);
      if (!groupId) {
        setClubUsers([]);
        setGroupName('');
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const clubData = await getClubUsersProgress(groupId);
      setClubUsers(clubData);
      setGroupName(clubData[0]?.clubName || '');
    } catch (e: any) {
      setError('No se pudo cargar el leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.mail, groupId]);

  useEffect(() => { load(); }, [load]);

  
  useEffect(() => {
    if (!user?.id) return;
    const ch1 = supabase
      .channel(`rt-leader-aprendidas-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Alumno_Senia', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    const ch2 = supabase
      .channel(`rt-leader-mods-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules_completed', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => {
      try { supabase.removeChannel(ch1); } catch {}
      try { supabase.removeChannel(ch2); } catch {}
    };
  }, [user?.id, load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Ranking principal: promedio de progreso por usuario
  const mainRanking = clubUsers
    .map(user => ({
      ...user,
      avgProgress:
        user.courses.length > 0
          ? user.courses.reduce((acc: number, c: any) => acc + c.progressPercentage, 0) / user.courses.length
          : 0,
    }))
    .sort((a, b) => b.avgProgress - a.avgProgress);

  // Ranking por cada courseId
  const courseMap: { [courseId: number]: { courseTitle: string; users: any[] } } = {};
  clubUsers.forEach(user => {
    user.courses.forEach((course: any) => {
      if (!courseMap[course.courseId]) {
        courseMap[course.courseId] = { courseTitle: course.courseTitle, users: [] };
      }
      courseMap[course.courseId].users.push({
        userId: user.userId,
        username: user.username,
        progressPercentage: course.progressPercentage,
        status: course.status,
      });
    });
  });

  // Ordenar usuarios por progreso en cada ranking de curso
  Object.values(courseMap).forEach(courseRanking => {
    courseRanking.users.sort((a, b) => b.progressPercentage - a.progressPercentage);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo_booksy.png')}
            style={{ height: 100, alignSelf: 'center', marginBottom: 5, marginTop: 10 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>{groupName ? `Club de Lectura: ${groupName}` : 'Leaderboard Grupo'}</Text>
          {loading && (
            <View style={styles.loadingBox}><ActivityIndicator color="#20bfa9" /><Text style={styles.loadingText}>Cargando…</Text></View>
          )}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {(!loading && clubUsers.length === 0) && (
            <Text style={styles.emptyText}>Aún no tienes un club de lectura, visita Booksy para unirte a uno.</Text>
          )}
        </View>

        {/* Ranking principal por promedio de progreso */}
        {clubUsers.length > 0 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Ranking General</Text>
            {mainRanking.map((item, idx) => (
              <View key={`${item.userId}-${idx}`} style={{ marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{idx + 1}. {item.username}</Text>
                <Text>Promedio de progreso: {item.avgProgress.toFixed(1)}%</Text>
              </View>
            ))}
            {/* Rankings individuales por curso */}
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>Rankings por curso</Text>
            {Object.entries(courseMap).map(([courseId, courseRanking]) => (
              <View key={courseId} style={{ marginBottom: 20 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{courseRanking.courseTitle}</Text>
                {courseRanking.users.map((user, idx) => (
                  <View
                    key={`${user.userId}-${courseId}-${idx}`}
                    style={{ marginBottom: 8, backgroundColor: '#f7f7f7', borderRadius: 8, padding: 8 }}
                  >
                    <Text>{idx + 1}. {user.username}</Text>
                    <Text>Progreso: {user.progressPercentage}%</Text>
                    <Text>Estado: {user.status}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6f7f2' },
  scrollView: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 64 },
  header: { paddingHorizontal: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#222', marginTop: 5, marginBottom: 12, alignSelf: 'center' },
  loadingBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  loadingText: { marginLeft: 8, color: '#555' },
  errorText: { color: '#c0392b', fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#555', fontStyle: 'italic', marginTop: 8 },
});
