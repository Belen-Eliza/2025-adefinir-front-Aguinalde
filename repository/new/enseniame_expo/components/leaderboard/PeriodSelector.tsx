import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { PeriodType } from './types';

interface Props {
  value: PeriodType;
  onChange: (p: PeriodType) => void;
  disabled?: boolean;
}

const periods: PeriodType[] = ['week', 'month', 'all'];

export const PeriodSelector: React.FC<Props> = ({ value, onChange, disabled }) => {
  return (
    <View style={styles.container}>
      {periods.map(p => (
        <TouchableOpacity
          key={p}
          disabled={disabled}
          style={[styles.btn, value === p && styles.btnActive]}
          onPress={() => onChange(p)}
        >
          <Text style={[styles.txt, value === p && styles.txtActive]}>
            {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Histórico'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignSelf: 'center', marginVertical: 12 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#e6f3f1', marginHorizontal: 4 },
  btnActive: { backgroundColor: '#20bfa9' },
  txt: { color: '#0a7ea4', fontSize: 14, fontWeight: '600' },
  txtActive: { color: '#fff' },
});
