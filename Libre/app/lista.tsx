import { View, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Text } from '../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useListaCompra } from '../src/lib/ListaCompraContext';
import SoftPressable from '../src/components/SoftPressable';
import Icono from '../src/components/Icono';
import { colors, radius, sombra } from '../src/theme';

export default function ListaScreen() {
  const { items, marcarComprado, eliminarItem, vaciarLista } = useListaCompra();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.contenido}>
        {items.length === 0 ? (
          <View style={styles.vacioBox}>
            <View style={styles.vacioIcono}>
              <Icono nombre="list" tamano={30} color={colors.accent} grosor={2} />
            </View>
            <Text style={styles.vacio}>
              Tu lista de la compra está vacía. Añade productos o ingredientes de recetas desde sus
              fichas.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <SoftPressable style={styles.fila} onPress={() => marcarComprado(item.id)} escala={0.99} haptica>
                  <View style={[styles.check, item.comprado && styles.checkOn]}>
                    {item.comprado && <Icono nombre="check" tamano={15} color="#fff" grosor={3} />}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.nombre, item.comprado && styles.tachado]}>{item.nombre}</Text>
                    {item.origen ? <Text style={styles.origen}>de: {item.origen}</Text> : null}
                  </View>
                  <Pressable onPress={() => eliminarItem(item.id)} hitSlop={10}>
                    <Icono nombre="close" tamano={16} color={colors.textMuted} grosor={2.2} />
                  </Pressable>
                </SoftPressable>
              )}
            />
            <SoftPressable
              style={styles.botonVaciar}
              onPress={() =>
                Alert.alert('Vaciar lista', '¿Seguro que quieres vaciar toda la lista?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Vaciar', style: 'destructive', onPress: vaciarLista },
                ])
              }
            >
              <Text style={styles.botonVaciarTexto}>Vaciar lista</Text>
            </SoftPressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  vacioBox: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20, gap: 16 },
  vacioIcono: {
    width: 64, height: 64, borderRadius: radius.xl,
    backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  vacio: { textAlign: 'center', color: colors.textMutedOnDark, lineHeight: 20 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  check: {
    width: 24, height: 24, borderRadius: 8,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  nombre: { fontSize: 15, color: colors.textDark, fontWeight: '600' },
  tachado: { textDecorationLine: 'line-through', color: colors.textMuted, fontWeight: '400' },
  origen: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  botonVaciar: { paddingVertical: 14, alignItems: 'center' },
  botonVaciarTexto: { color: colors.dangerText, fontWeight: '600' },
});
