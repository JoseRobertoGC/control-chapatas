// src/screens/SelectPointScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useInventory } from '../context/InventoryContext';

export default function SelectPointScreen({ navigation }) {
  const { setPoint } = useInventory();

  const selectPoint = async (p) => {
    await setPoint(p); // ahora guarda en Firebase + estado global
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿En qué punto de venta te encuentras?</Text>
      <View style={styles.buttonGroup}>
        <Button color="#000000" title="Punto A" onPress={() => selectPoint('A')} />
        <Button color="#000000" title="Punto B" onPress={() => selectPoint('B')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4B31A', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, marginBottom: 30, fontWeight: 'bold' },
  buttonGroup: { gap: 16 },
});
