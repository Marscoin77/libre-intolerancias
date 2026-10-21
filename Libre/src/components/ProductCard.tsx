import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Texto';
import { Producto } from '../data/productos';
import { evaluarCompatibilidad } from '../lib/compatibilidad';
import { IntoleranciaId } from '../data/intolerancias';
import FotoProducto from './FotoProducto';
import SoftPressable from './SoftPressable';
import NutriScore from './NutriScore';
import Veredicto from './Veredicto';
import Icono from './Icono';
import { colors, radius, sombra } from '../theme';

function ProductCard({
  producto,
  intolerancias,
  onPress,
}: {
  producto: Producto;
  intolerancias: IntoleranciaId[];
  onPress: () => void;
}) {
  const resultado = evaluarCompatibilidad(producto, intolerancias);

  return (
    <SoftPressable style={styles.card} onPress={onPress} escala={0.975} haptica>
      <FotoProducto producto={producto} tamano={72} />
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>
          {producto.nombre}
        </Text>
        <Text style={styles.categoria} numberOfLines={1}>
          {producto.categoria}
        </Text>
        <View style={styles.filaInferior}>
          <Veredicto estado={resultado.estado} />
          {producto.precioAprox > 0 && (
            <Text style={styles.precio}>
              {producto.precioTipo === 'estimado' ? '≈ ' : ''}
              {producto.precioAprox.toFixed(2)} €
            </Text>
          )}
        </View>
      </View>
      <View style={styles.lateral}>
        {/^[px]\d+$/.test(producto.id) ? (
          <Text style={styles.calidad}>{'⭐'.repeat(producto.calidad)}</Text>
        ) : producto.nutriscore ? (
          <NutriScore grado={producto.nutriscore} compacto estimado={producto.nutriscoreEstimado} />
        ) : (
          <View />
        )}
        <Icono nombre="chevron" tamano={18} color={colors.textMuted} grosor={2.2} />
      </View>
    </SoftPressable>
  );
}

// Memoizado: en listas largas evita re-renderizar tarjetas que no han cambiado al hacer scroll.
// onPress se omite a propósito: en las listas es una arrow nueva por render, pero siempre navega
// de forma determinista según el id del producto, así que no afecta al resultado.
export default memo(
  ProductCard,
  (a, b) => a.producto.id === b.producto.id && a.intolerancias === b.intolerancias
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    ...sombra,
  },
  info: { flex: 1, minWidth: 0 },
  nombre: { fontSize: 14.5, fontWeight: '700', color: colors.textDark, lineHeight: 19 },
  categoria: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  filaInferior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 },
  precio: { fontSize: 13.5, color: colors.textDark, fontWeight: '700' },
  lateral: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', gap: 8 },
  calidad: { fontSize: 11 },
});
