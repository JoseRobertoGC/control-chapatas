// src/navigation/AppNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, Image } from "react-native";
import { useInventory } from "../context/InventoryContext";

// Pantallas reales
import VentasScreen from "../screens/VentasScreen";
import InventarioInicialScreen from "../screens/InventarioInicialScreen";
import RealizarVentaScreen from "../screens/RealizarVentaScreen";
import TraspasosScreen from "../screens/TraspasosScreen";
import ReportesScreen from "../screens/ReportesScreen";
import CustomHeader from "../components/CustomHeader";
import ProductosScreen from "../screens/ProductosScreen";

const Tab = createBottomTabNavigator();
const VentasStack = createNativeStackNavigator();

function VentasStackScreen() {
  const { ventaIniciada } = useInventory();

  return (
    <VentasStack.Navigator screenOptions={{ headerShown: false }}>
      <VentasStack.Screen name="VentasHome" component={VentasScreen} />
      <VentasStack.Screen
        name="InventarioInicial"
        component={InventarioInicialScreen}
      />
      <VentasStack.Screen
        name="RealizarVenta"
        component={RealizarVentaScreen}
      />
      <VentasStack.Screen name="Productos" component={ProductosScreen} />
    </VentasStack.Navigator>
  );
}

const getIcon = (routeName, focused) => {
  switch (routeName) {
    case "Ventas":
      return focused
        ? require("../../assets/cutlery (1).png")
        : require("../../assets/cutlery.png");
    case "Traspasos":
      return focused
        ? require("../../assets/transfer (1).png")
        : require("../../assets/transfer.png");
    case "Reportes":
      return focused
        ? require("../../assets/report (1).png")
        : require("../../assets/report.png");
    default:
      return null;
  }
};

function DummyScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Pantalla en construcción</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => {
          let title = "";
          if (route.name === "Ventas") title = "Ventas";
          if (route.name === "Traspasos") title = "Traspasos";
          if (route.name === "Reportes") title = "Reportes";
          return <CustomHeader title={title} />;
        },
        tabBarIcon: ({ focused }) => {
          const icon = getIcon(route.name, focused);
          return icon ? (
            <Image
              source={icon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "white" : "gray",
              }}
            />
          ) : null;
        },
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "black",
          borderTopWidth: 0,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="Ventas" component={VentasStackScreen} />
      <Tab.Screen name="Traspasos" component={TraspasosScreen} />
      <Tab.Screen name="Reportes" component={ReportesScreen} />
    </Tab.Navigator>
  );
}
