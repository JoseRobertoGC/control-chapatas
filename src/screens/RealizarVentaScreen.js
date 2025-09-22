// src/screens/RealizarVentaScreen.js
import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Pressable,
  Modal,
} from "react-native";
import { useInventory } from "../context/InventoryContext";
import { useNavigation } from "@react-navigation/native";

const assets = {
  chapata: require("../../assets/chapata.png"),
  sandwich: require("../../assets/sandwich.png"),
};

const getImageSource = (image) => {
  if (!image) return null;
  if (image.type === "uri") return { uri: image.uri };
  if (image.type === "asset" && assets[image.name]) return assets[image.name];
  return null;
};

export default function RealizarVentaScreen() {
  const { point, stock, sell, finalizarVenta, products } = useInventory();
  const navigation = useNavigation();

  const [orden, setOrden] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState(null);
  const { ventaIniciada } = useInventory();

  useEffect(() => {
    if (!ventaIniciada) {
      navigation.replace("VentasHome");
    }
  }, [ventaIniciada]);

  const agregarProducto = async (producto) => {
    const qty = parseInt(cantidades[producto.id]) || 1;
    const disponibles = stock[point]?.[producto.id] ?? 0;

    if (qty <= 0) {
      Alert.alert("Cantidad inválida", "Debe ser mayor a 0");
      return;
    }
    if (qty > disponibles) {
      Alert.alert("Stock insuficiente", "No hay suficientes productos disponibles.");
      return;
    }

    const ventaExitosa = await sell(producto.id, qty, point); // 🔥 ahora actualiza Firebase
    if (!ventaExitosa) return;

    const subtotalNuevo = qty * producto.price;

    setOrden((prev) => {
      const index = prev.findIndex((item) => item.id === producto.id);
      if (index !== -1) {
        const nuevaOrden = [...prev];
        const existente = nuevaOrden[index];
        const nuevaCantidad = existente.cantidad + qty;
        nuevaOrden[index] = {
          ...existente,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * producto.price,
        };
        return nuevaOrden;
      } else {
        return [
          ...prev,
          {
            id: producto.id,
            nombre: producto.name,
            cantidad: qty,
            subtotal: subtotalNuevo,
            precio: producto.price,
          },
        ];
      }
    });

    setCantidades((prev) => ({ ...prev, [producto.id]: "1" }));
  };

  const totalOrden = orden.reduce((acc, item) => acc + item.subtotal, 0);

  const eliminarProducto = async () => {
    if (!productoEliminar) return;

    // 🔥 restaurar stock en Firebase
    await sell(productoEliminar.id, -productoEliminar.cantidad, point);

    setOrden((prevOrden) =>
      prevOrden.filter((item) => item.id !== productoEliminar.id)
    );

    setProductoEliminar(null);
    setModalVisible(false);
  };

  const finalizarVentaDiaria = async () => {
    try {
      await finalizarVenta(); // 🔥 guarda ticket en Firebase
      Alert.alert("Venta finalizada", "El registro del día se guardó correctamente.");
      setOrden([]);
      setCantidades({});
      navigation.replace("VentasHome");
    } catch (error) {
      console.error("Error al finalizar venta:", error);
      Alert.alert("Error", "No se pudo registrar la venta.");
    }
  };

  const imprimirTicket = async () => {
    Alert.alert("Ticket", "Aquí se imprimirá el ticket.");
    setOrden([]);         // Reinicia la orden actual
    setCantidades({});    // Limpia inputs de cantidades
    const totalStockA = Object.values(stock.A || {}).reduce((acc, val) => acc + val, 0);
    const totalStockB = Object.values(stock.B || {}).reduce((acc, val) => acc + val, 0);
  
    if (totalStockA === 0 && totalStockB === 0) {
      await finalizarVenta();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 100,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.newCard}
            onPress={() => agregarProducto(item)}
          >
            <Image source={getImageSource(item.image)} style={styles.newImage} />
            <Text style={styles.newTitle}>{item.name}</Text>
            <Text style={styles.newPrice}>${item.price}</Text>
            <Text style={styles.newStock}>
              Disponibles: {stock[point]?.[item.id] ?? 0}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenTitle}>Resumen de orden</Text>

        {orden.map((item, idx) => (
          <View key={idx} style={styles.resumenRow}>
            <Text style={styles.resumenItem}>{item.nombre}</Text>
            <TextInput
              style={styles.resumenInput}
              keyboardType="numeric"
              value={String(item.cantidad)}
              editable={false}
            />
            <TouchableOpacity
              onPress={() => {
                setProductoEliminar(item);
                setModalVisible(true);
              }}
            >
              <Image
                source={require("../../assets/trash.png")}
                style={styles.trashIcon}
              />
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.total}>TOTAL: ${totalOrden}</Text>

        <TouchableOpacity style={styles.ticketBtn} onPress={imprimirTicket}>
          <Text style={styles.ticketText}>Imprimir ticket</Text>
        </TouchableOpacity>
      </View>

      {/* Modal eliminar producto */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar productos</Text>
            <Text style={styles.modalText}>
              ¿Deseas eliminar los productos agregados?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#d32f2f" }]}
                onPress={eliminarProducto}
              >
                <Text style={styles.modalBtnText}>Eliminar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#777" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4B31A", padding: 16 },
  newCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    width: "42%",
    minWidth: 140,
    maxWidth: 180,
  },
  newImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 8,
  },
  newTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  newPrice: { fontSize: 14, color: "#444" },
  newStock: { fontSize: 14, color: "#777" },
  resumen: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  resumenTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    marginHorizontal: 50,
  },
  resumenItem: { fontSize: 16, fontWeight: "500", flex: 1 },
  resumenInput: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    width: 60,
    textAlign: "center",
    fontWeight: "600",
  },
  trashIcon: { width: 25, height: 25, marginLeft: 10, tintColor: "#d32f2f" },
  total: { marginTop: 10, fontWeight: "bold", fontSize: 25, textAlign: "center" },
  ticketBtn: {
    marginTop: 12,
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  ticketText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 15, marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
