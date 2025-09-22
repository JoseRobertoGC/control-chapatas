// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useInventory } from '../context/InventoryContext';

export default function SplashScreen({ navigation }) {
  const { point, ventaIniciada, setPoint, setVentaIniciada } = useInventory();

  useEffect(() => {
    const checkInitialStatus = async () => {
      setTimeout(() => {
        if (!point) {
          navigation.replace('SelectPoint');
        } else {
          // Por si point ya viene de AsyncStorage en el contexto
          setPoint(point);
          setVentaIniciada(ventaIniciada);

          if (ventaIniciada) {
            navigation.replace('MainTabs', { screen: 'Ventas', params: { screen: 'RealizarVenta' } });
          } else {
            navigation.replace('MainTabs', { screen: 'Ventas', params: { screen: 'VentasHome' } });
          }
        }
      }, 2000);
    };

    checkInitialStatus();
  }, [point, ventaIniciada]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>BIENVENIDO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4B31A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
