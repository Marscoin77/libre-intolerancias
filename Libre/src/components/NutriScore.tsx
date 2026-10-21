import { View, StyleSheet } from 'react-native';
import { Text } from './Texto';

/** Colores oficiales del Nutri-Score, de la A (más saludable) a la E. */
const COLORES: Record<string, string> = {
  a: '#1E8F4E',
  b: '#7AC142',
  c: '#F2C200',
  d: '#F08A24',
  e: '#E63E11',
};
const LETRAS = ['a', 'b', 'c', 'd', 'e'] as const;

/**
 * Escala Nutri-Score compacta: muestra A·B·C·D·E y resalta en su color la letra del producto
 * (las demás quedan en gris). `compacto` reduce el tamaño para las tarjetas de la lista.
 */
export default function NutriScore({
  grado,
  compacto = false,
  estimado = false,
}: {
  grado: string;
  compacto?: boolean;
  estimado?: boolean;
}) {
  const g = (grado || '').toLowerCase();
  if (!COLORES[g]) return null;

  const base = compacto ? 15 : 20;
  const activoSize = compacto ? 20 : 26;

  return (
    <View
      style={styles.fila}
      accessibilityLabel={`Nutri-Score ${g.toUpperCase()}${estimado ? ' estimado' : ''}`}
    >
      {estimado && (
        <Text style={[styles.aprox, { fontSize: compacto ? 12 : 15 }]}>≈</Text>
      )}
      {LETRAS.map((l) => {
        const activo = l === g;
        return (
          <View
            key={l}
            style={[
              styles.celda,
              {
                width: activo ? activoSize : base,
                height: activo ? activoSize : base,
                backgroundColor: activo ? COLORES[l] : '#EDEAF3',
              },
            ]}
          >
            <Text
              style={{
                fontSize: activo ? (compacto ? 12 : 15) : compacto ? 9 : 11,
                fontWeight: '800',
                color: activo ? '#fff' : '#B7B1C4',
              }}
            >
              {l.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  celda: { borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  aprox: { color: '#B7B1C4', fontWeight: '800', marginRight: 1 },
});
