// src/screens/TraspasosScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useInventory } from '../context/InventoryContext';

export default function TraspasosScreen() {
  const { point, stock, transfer, products, ventaIniciada } = useInventory();
  const [cantidades, setCantidades] = useState({});

  const puntoDestino = point === 'A' ? 'B' : 'A';

  // Inicializar cantidades dinámicamente cuando cambien los productos
  useEffect(() => {
    const initial = {};
    products.forEach((p) => {
      initial[p.id] = cantidades[p.id] ?? "1"; 
    });
    setCantidades(initial);
  }, [products]);

  const handleTransfer = (productoId) => {
    if (!ventaIniciada) return; // 🔒 Bloquea si no hay venta
    const cantidad = Number(cantidades[productoId]) || 0;
    if (cantidad > 0) {
      transfer(productoId, cantidad, puntoDestino);
      setCantidades((prev) => ({ ...prev, [productoId]: '1' }));
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const disponibles = ventaIniciada ? (stock[point]?.[item.id] ?? 0) : 0;

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.stock}>
                Disponibles en {point}: {disponibles}
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  value={cantidades[item.id]}
                  onChangeText={(text) =>
                    setCantidades((prev) => ({ ...prev, [item.id]: text }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                  editable={ventaIniciada} // 🔒 bloquea edición si no hay venta
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  !ventaIniciada && { backgroundColor: '#999' }, // 🔒 gris si bloqueado
                ]}
                onPress={() => handleTransfer(item.id)}
                disabled={!ventaIniciada} // 🔒 desactiva botón
              >
                <Text style={styles.buttonText}>
                  Traspasar {point} → {puntoDestino}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB930',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  stock: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
  },
  input: {
    width: 60,
    backgroundColor: '#ddd',
    padding: 8,
    textAlign: 'center',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
