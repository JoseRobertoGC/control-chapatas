import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryProvider } from './src/context/InventoryContext';
import SplashScreen from './src/screens/SplashScreen';
import SelectPointScreen from './src/screens/SelectPointScreen';
import MainTabs from './src/navigation/AppNavigator'; // tus tabs: Ventas, Traspasos, Reportes

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <InventoryProvider>
      <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SelectPoint" component={SelectPointScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
    </InventoryProvider>
  );
}

