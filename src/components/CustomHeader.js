import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useInventory } from '../context/InventoryContext';
import { FullWindowOverlay } from 'react-native-screens';
import { useNavigation } from '@react-navigation/native';

export default function CustomHeader({ title }) {
  const { point, finalizarVenta } = useInventory();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {/* Logo como botón */}
      <TouchableOpacity onPress={() => setSidebarVisible(true)}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
         onPress={() => {
          navigation.replace('SelectPoint');
        }}
        >
          <Text style={styles.punto}>Punto de Venta: {point}</Text>
      </TouchableOpacity>

      {/* Sidebar */}
      <Modal transparent animationType="slide" visible={sidebarVisible}>
        <View style={styles.overlay}>
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Menú</Text>

            <Pressable
              style={styles.sidebarBtn}
              onPress={async () => {
                await finalizarVenta(); // usa la misma lógica
                setSidebarVisible(false);
                navigation.navigate("Ventas", { screen: "VentasHome" });
              }}
            >
              <Text style={styles.sidebarBtnText}>Finalizar Venta</Text>
            </Pressable>

            <Pressable
              style={styles.sidebarBtn}
              onPress={() => {
                setSidebarVisible(false);
                navigation.navigate('Ventas', {
                  screen: 'Productos',
                });
              }}
            >
              <Text style={styles.sidebarBtnText}>Inventario (Precios y Productos)</Text>
            </Pressable>

            <Pressable
              style={[styles.sidebarBtn, { backgroundColor: '#ccc' }]}
              onPress={() => setSidebarVisible(false)}
            >
              <Text style={styles.sidebarBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'end',
    justifyContent: 'space-between',
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginTop: 20,
  },
  title: {
    fontSize: 25,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'flex-start',
    marginHorizontal: 10,
    marginTop: 30,
  },
  punto: {
    color: 'white',
    fontSize: 14,
    marginTop: 39,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sidebar: {
    width: 250,
    height: "100%",
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sidebarBtn: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  sidebarBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
