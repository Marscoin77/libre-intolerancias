import { View, StyleSheet } from 'react-native';
import { Text } from './Texto';
import Icono from './Icono';
import { Estado, ESTADO_INFO } from '../lib/compatibilidad';
import { colors, radius } from '../theme';

/**
 * Lenguaje visual del veredicto Apto / Precaución / No apto.
 * Nunca depende solo del color: siempre lleva icono (forma distinta) y etiqueta, para que se
 * entienda de un vistazo y con daltonismo.
 *
 *  - variante "tag": pastilla compacta para las tarjetas de lista.
 *  - variante "barra": bloque destacado para la ficha de producto, con el motivo.
 */
export default function Veredicto({
  estado,
  variante = 'tag',
  motivo,
}: {
  estado: Estado;
  variante?: 'tag' | 'barra';
  motivo?: string;
}) {
  const info = ESTADO_INFO[estado];

  if (variante === 'barra') {
    return (
      <View
        style={[styles.barra, { backgroundColor: info.bg, borderColor: info.color + '55' }]}
        accessibilityLabel={`${info.etiquetaCorta}. ${motivo ?? ''}`}
      >
        <View style={[styles.barraIcono, { backgroundColor: info.color }]}>
          <Icono nombre={info.icono} tamano={22} color="#fff" grosor={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.barraTitulo, { color: info.color }]}>{info.etiquetaCorta}</Text>
          {motivo ? <Text style={styles.barraMotivo}>{motivo}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tag, { backgroundColor: info.bg }]} accessibilityLabel={info.etiquetaCorta}>
      <Icono nombre={info.icono} tamano={13} color={info.color} grosor={2.4} />
      <Text style={[styles.tagTexto, { color: info.color }]}>{info.etiquetaCorta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  tagTexto: { fontSize: 11.5, fontWeight: '700' },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  barraIcono: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  barraTitulo: { fontSize: 15.5, fontWeight: '800' },
  barraMotivo: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
});
