// src/screens/InventarioInicialScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useInventory } from '../context/InventoryContext';

export default function InventarioInicialScreen({ navigation }) {
  const { setInitialStock, setVentaIniciada, iniciarRegistro, products } = useInventory();

  // Estados dinámicos para cada punto y producto
  const [stockA, setStockA] = useState({});
  const [stockB, setStockB] = useState({});

  const handleChange = (point, productId, value) => {
    const parsed = parseInt(value) || 0;
    if (point === "A") {
      setStockA((prev) => ({ ...prev, [productId]: parsed }));
    } else {
      setStockB((prev) => ({ ...prev, [productId]: parsed }));
    }
  };

  const guardarInventario = async () => {
    try {
      // 🔥 aseguramos que todos los productos tengan número
      const data = { A: {}, B: {} };
  
      products.forEach((p) => {
        data.A[p.id] = stockA[p.id] ?? 0;
        data.B[p.id] = stockB[p.id] ?? 0;
      });
  
      // Guardar en Firebase (stocks/A y stocks/B)
      await setInitialStock(data);
  
      // Iniciar registro del día
      iniciarRegistro();
      setVentaIniciada(true);
  
      Alert.alert("✅ Inventario registrado", "Ya puedes comenzar la venta.");
      navigation.replace("RealizarVenta");
    } catch (error) {
      console.error("Error guardando inventario ❌", error);
      Alert.alert("Error", "No se pudo guardar el inventario.");
    }
  };
  

  const renderInputs = (point, stock) => (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{item.name}</Text>
          <TextInput
            keyboardType="numeric"
            style={styles.input}
            placeholder="0"
            value={String(stock[item.id] ?? "")}
            onChangeText={(value) => handleChange(point, item.id, value)}
          />
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventario Inicial</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Punto A</Text>
        {renderInputs("A", stockA)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Punto B</Text>
        {renderInputs("B", stockB)}
      </View>

      <TouchableOpacity style={styles.button} onPress={guardarInventario}>
        <Text style={styles.buttonText}>GUARDAR INVENTARIO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4B31A",
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  inputLabel: {
    fontSize: 16,
  },
  input: {
    width: 100,
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 6,
    textAlign: "right",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
