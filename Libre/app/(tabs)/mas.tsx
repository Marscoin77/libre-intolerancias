import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePerfil } from '../../src/lib/PerfilContext';
import SoftPressable from '../../src/components/SoftPressable';
import Icono, { NombreIcono } from '../../src/components/Icono';
import { colors, radius, sombra } from '../../src/theme';

const OPCIONES: { icono: NombreIcono; label: string; ruta: string }[] = [
  { icono: 'user', label: 'Perfiles e intolerancias', ruta: '/perfil' },
  { icono: 'barcode', label: 'Escanear producto', ruta: '/escaner' },
  { icono: 'camera', label: 'Analizar etiqueta con la cámara', ruta: '/etiqueta' },
  { icono: 'list', label: 'Lista de la compra', ruta: '/lista' },
];

export default function MasScreen() {
  const { perfil } = usePerfil();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Más</Text>

        <View style={styles.resumenBox}>
          <View style={styles.resumenAvatar}>
            <Text style={styles.resumenAvatarEmoji}>{perfil.avatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumenTitulo}>Perfil activo: {perfil.nombre}</Text>
            <Text style={styles.resumenTexto}>
              {perfil.intolerancias.length > 0
                ? `${perfil.intolerancias.length} intolerancia(s) configurada(s)`
                : 'Sin intolerancias configuradas todavía'}
            </Text>
          </View>
        </View>

        <View style={styles.lista}>
          {OPCIONES.map((op, idx) => (
            <SoftPressable
              key={op.ruta}
              style={[styles.fila, idx === OPCIONES.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push(op.ruta as never)}
              escala={0.98}
              haptica
            >
              <View style={styles.filaIcono}>
                <Icono nombre={op.icono} tamano={20} color={colors.accentDeep} grosor={2} />
              </View>
              <Text style={styles.filaTexto}>{op.label}</Text>
              <Icono nombre="chevron" tamano={18} color={colors.textMuted} grosor={2.2} />
            </SoftPressable>
          ))}
        </View>

        <View style={styles.avisoBox}>
          <Text style={styles.avisoTexto}>
            Libre es una herramienta de apoyo informativo. Verifica siempre el etiquetado físico
            del producto antes de consumirlo.
          </Text>
          <Text style={[styles.avisoTexto, { marginTop: 12 }]}>
            Datos de productos: © colaboradores de Open Food Facts, licencia ODbL. Fotos: licencia
            CC BY-SA. Precios: Open Prices (Open Food Facts), licencia ODbL. Los supermercados se
            indican según datos aportados por la comunidad y pueden no estar actualizados. Esta app
            es independiente y no está afiliada a ningún supermercado.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 23, fontWeight: '800', color: colors.textOnDark, marginBottom: 16 },
  resumenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  resumenAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumenAvatarEmoji: { fontSize: 26, lineHeight: 32 },
  resumenTitulo: { color: colors.accentDeep, fontWeight: '800', fontSize: 15 },
  resumenTexto: { color: colors.accentDeep, fontSize: 13, marginTop: 4, opacity: 0.85 },
  lista: { backgroundColor: colors.card, ...sombra, borderRadius: radius.lg, paddingHorizontal: 14 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  filaIcono: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaTexto: { flex: 1, fontSize: 14, color: colors.textDark, fontWeight: '600' },
  avisoBox: { marginTop: 20 },
  avisoTexto: { fontSize: 12, color: colors.textMutedOnDark, textAlign: 'center', lineHeight: 17 },
});
