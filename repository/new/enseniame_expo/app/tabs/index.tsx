import {  View,StyleSheet, ActivityIndicator,
} from 'react-native';
import { useUserContext } from '@/hooks/useUserContext';
import { paleta } from '@/components/colores';
import { useFocusEffect } from 'expo-router';
import React from 'react';

export default function Inicio() {
  const contexto =useUserContext();
  useFocusEffect(
      React.useCallback(() => {
        contexto.user.goHome()
      }, [])
    );
  return (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={paleta.dark_aqua} />
      </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f7f2',
  },
});
