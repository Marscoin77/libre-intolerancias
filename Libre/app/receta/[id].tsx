import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { RECETAS } from '../../src/data/recetas';
import { useListaCompra } from '../../src/lib/ListaCompraContext';
import SoftPressable from '../../src/components/SoftPressable';
import Icono from '../../src/components/Icono';
import { colors, radius, sombra } from '../../src/theme';

export default function RecetaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { añadirItems } = useListaCompra();
  const receta = RECETAS.find((r) => r.id === id);

  if (!receta) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.vacio}>No se ha encontrado esta receta.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.accentSoft, '#EDE6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.foto}>
          <Text style={styles.emoji}>{receta.emoji}</Text>
        </LinearGradient>
        <Text style={styles.nombre}>{receta.nombre}</Text>
        <Text style={styles.meta}>
          ⏱ {receta.tiempoMin} min · {receta.dificultad} · {receta.costeAprox} · 👥 {receta.personasBase} personas
        </Text>

        <View style={styles.seccionBox}>
          <View style={styles.seccionCab}>
            <Icono nombre="list" tamano={16} color={colors.accent} grosor={2.1} />
            <Text style={styles.seccionTitulo}>Ingredientes</Text>
          </View>
          {receta.ingredientes.map((ing, i) => (
            <Text key={i} style={styles.texto}>• {ing}</Text>
          ))}
        </View>

        <View style={styles.seccionBox}>
          <View style={styles.seccionCab}>
            <Icono nombre="pot" tamano={16} color={colors.accent} grosor={2.1} />
            <Text style={styles.seccionTitulo}>Preparación</Text>
          </View>
          {receta.preparacion.map((paso, i) => (
            <Text key={i} style={styles.texto}>{i + 1}. {paso}</Text>
          ))}
        </View>

        <SoftPressable
          style={styles.boton}
          haptica
          onPress={() => {
            añadirItems(receta.ingredientes, receta.nombre);
            Alert.alert('Añadido', 'Los ingredientes se han añadido a tu lista de la compra.');
          }}
        >
          <Icono nombre="plus" tamano={18} color="#fff" grosor={2.4} />
          <Text style={styles.botonTexto}>Añadir ingredientes a la lista</Text>
        </SoftPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60 },
  vacio: { textAlign: 'center', color: colors.textMutedOnDark, marginTop: 40 },
  foto: {
    width: '100%',
    height: 140,
    borderRadius: radius.xl,
    ...sombra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 54 },
  nombre: { fontSize: 22, fontWeight: '800', color: colors.textOnDark, marginTop: 16 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 6, marginBottom: 4 },
  seccionBox: { marginTop: 16, backgroundColor: colors.card, ...sombra, borderRadius: radius.lg, padding: 16 },
  seccionCab: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  seccionTitulo: { fontSize: 15, fontWeight: '800', color: colors.textOnDark },
  texto: { fontSize: 14, color: colors.textDark, lineHeight: 22 },
  boton: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
