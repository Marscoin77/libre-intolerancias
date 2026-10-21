import { View, StyleSheet } from 'react-native';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Icono from '../../src/components/Icono';
import { colors, radius } from '../../src/theme';

export default function ProductoNoEncontrado() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.contenido}>
        <View style={styles.icono}>
          <Icono nombre="search" tamano={34} color={colors.accent} grosor={2} />
        </View>
        <Text style={styles.titulo}>Producto no encontrado</Text>
        <Text style={styles.texto}>
          No tenemos datos para el código {codigo}. Ni en el catálogo de Libre ni en Open Food
          Facts hay información sobre este producto todavía.
        </Text>
        <Text style={styles.aviso}>
          Revisa el etiquetado físico del producto para confirmar sus ingredientes y alérgenos.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  icono: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.textOnDark, marginBottom: 10 },
  texto: { fontSize: 14, color: colors.textMutedOnDark, textAlign: 'center', lineHeight: 20 },
  aviso: {
    marginTop: 16,
    fontSize: 13,
    color: colors.warningText,
    backgroundColor: colors.warningBg,
    padding: 12,
    borderRadius: radius.md,
    textAlign: 'center',
  },
});
