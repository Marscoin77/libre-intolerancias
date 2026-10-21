import { Tabs } from 'expo-router';
import { View, ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono, { NombreIcono } from '../../src/components/Icono';
import { colors, fuente, radius } from '../../src/theme';

function TabIcon({ nombre, color, focused }: { nombre: NombreIcono; color: ColorValue; focused: boolean }) {
  const c = typeof color === 'string' ? color : colors.accent;
  return (
    <View style={{ opacity: focused ? 1 : 0.9 }}>
      <Icono nombre={nombre} tamano={focused ? 25 : 23} color={c} grosor={focused ? 2.3 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Deja hueco para la barra de gestos/navegación de Android (insets.bottom) más un margen
  // cómodo, para que los iconos no queden pegados al borde y no se salga uno de la app sin querer.
  const margenInferior = insets.bottom + 14;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: fuente.semibold, marginTop: 2 },
        tabBarItemStyle: { paddingTop: 4 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          height: 60 + margenInferior,
          paddingTop: 10,
          paddingBottom: margenInferior,
          elevation: 12,
          shadowColor: '#2A3D33',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color, focused }) => <TabIcon nombre="home" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="productos"
        options={{ title: 'Productos', tabBarIcon: ({ color, focused }) => <TabIcon nombre="search" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="tiendas"
        options={{ title: 'Tiendas', tabBarIcon: ({ color, focused }) => <TabIcon nombre="pin" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="recetas"
        options={{ title: 'Recetas', tabBarIcon: ({ color, focused }) => <TabIcon nombre="pot" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: 'Más', tabBarIcon: ({ color, focused }) => <TabIcon nombre="star" color={color} focused={focused} /> }}
      />
    </Tabs>
  );
}
