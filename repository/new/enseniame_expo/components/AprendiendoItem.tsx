import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  nombre: string;
  categoria: string;
  cant_aciertos: number
};

function AprendiendoItem({ nombre, categoria, cant_aciertos }: Props) {
    const progress =  Math.min(cant_aciertos / 10, 1) ;
    const percent = Math.round(progress * 100);
  return (
    <View style={styles.card}>
    <View style={styles.row}>
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.count}>{cant_aciertos}/10 aciertos</Text>
    </View>      
    <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
          
    <View style={styles.row}>
        <Text style={styles.badge}>{categoria}</Text>    
        <Text style={styles.percent}>{percent}%</Text>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#e6f7f2',
    color: '#20bfa9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '600',
  },
  fecha: {
    color: '#555',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e9f7f4',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#20bfa9',
    borderRadius: 8,
  },
  percent: {
    alignSelf: 'flex-end',
    color: '#20bfa9',
    fontWeight: 'bold',
    marginTop: 6,
  },
   count: {
    color: '#555',
    fontWeight: '600',
  },
});

export {AprendiendoItem}