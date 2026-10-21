import { Appearance, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { PerfilProvider } from '../src/lib/PerfilContext';
import { ListaCompraProvider } from '../src/lib/ListaCompraContext';
import { colors, fuente } from '../src/theme';

// La app es solo de tema claro: se fuerza también para alertas, teclado e interruptores del sistema
Appearance.setColorScheme('light');

export default function RootLayout() {
  const [fuentesListas, errorFuentes] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  // Si las fuentes fallan se sigue con la tipografía del sistema en vez de bloquear la app
  if (!fuentesListas && !errorFuentes) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <PerfilProvider>
      <ListaCompraProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.accent,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTitleAlign: 'center',
            headerTitleStyle: { color: colors.textOnDark, fontFamily: fuente.bold, fontSize: 17 },
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
            animationDuration: 260,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="producto/[id]" options={{ title: 'Producto' }} />
          <Stack.Screen name="receta/[id]" options={{ title: 'Receta' }} />
          <Stack.Screen name="cadena/[id]" options={{ title: 'Supermercado' }} />
          <Stack.Screen name="lista" options={{ title: 'Lista de la compra' }} />
          <Stack.Screen name="perfil" options={{ title: 'Mis perfiles' }} />
          <Stack.Screen name="escaner" options={{ title: 'Escanear producto' }} />
          <Stack.Screen name="etiqueta" options={{ title: 'Analizar etiqueta' }} />
          <Stack.Screen name="restaurante/[id]" options={{ title: 'Restaurante' }} />
          <Stack.Screen name="restaurante/nuevo" options={{ title: 'Añadir restaurante' }} />
        </Stack>
      </ListaCompraProvider>
    </PerfilProvider>
  );
}
