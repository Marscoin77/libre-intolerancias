import { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { buscarProductoPorCodigoBarras } from '../src/data/productos';
import { buscarEnOpenFoodFacts } from '../src/lib/openFoodFacts';
import { guardarEnCache } from '../src/lib/productCache';
import SoftPressable from '../src/components/SoftPressable';
import Icono from '../src/components/Icono';
import { colors, radius } from '../src/theme';

export default function EscanerScreen() {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [buscando, setBuscando] = useState(false);
  const escaneado = useRef(false);

  async function onBarcodeScanned(resultado: BarcodeScanningResult) {
    if (escaneado.current) return;
    escaneado.current = true;
    setBuscando(true);

    const codigo = resultado.data;
    const local = buscarProductoPorCodigoBarras(codigo);
    if (local) {
      setBuscando(false);
      router.push(`/producto/${local.id}`);
      setTimeout(() => (escaneado.current = false), 1500);
      return;
    }

    const remoto = await buscarEnOpenFoodFacts(codigo);
    setBuscando(false);
    if (remoto) {
      guardarEnCache(remoto);
      router.push(`/producto/${remoto.id}`);
    } else {
      router.push({ pathname: '/producto/no-encontrado', params: { codigo } });
    }
    setTimeout(() => (escaneado.current = false), 1500);
  }

  if (!permiso) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!permiso.granted) {
    return (
      <SafeAreaView style={styles.centro}>
        <View style={styles.permisoIcono}>
          <Icono nombre="barcode" tamano={34} color={colors.accent} grosor={2} />
        </View>
        <Text style={styles.texto}>Libre necesita acceso a la cámara para escanear productos.</Text>
        <SoftPressable style={styles.boton} onPress={solicitarPermiso} haptica>
          <Text style={styles.botonTexto}>Dar permiso</Text>
        </SoftPressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.marco} />
        <Text style={styles.instruccion}>Apunta al código de barras del producto</Text>
        {buscando && <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.bg },
  texto: { textAlign: 'center', color: colors.textOnDark, fontSize: 15 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marco: {
    width: 240,
    height: 140,
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: 16,
  },
  instruccion: { color: '#fff', marginTop: 16, fontSize: 14, fontWeight: '600' },
  permisoIcono: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  boton: { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 13, paddingHorizontal: 22 },
  botonTexto: { color: '#fff', fontWeight: '700' },
});
