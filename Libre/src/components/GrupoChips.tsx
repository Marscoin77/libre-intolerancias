import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './Texto';
import SoftPressable from './SoftPressable';
import { colors } from '../theme';

export interface OpcionChip {
  id: string;
  label: string;
}

/**
 * Fila de chips con título. Selección única (`valor` es un id) o múltiple (`valor` es un array).
 * En selección única, volver a pulsar la opción activa la desmarca si `permitirVacio`.
 */
export default function GrupoChips({
  titulo,
  opciones,
  valor,
  onChange,
  multi = false,
}: {
  titulo: string;
  opciones: OpcionChip[];
  valor: string | string[];
  onChange: (nuevo: string | string[]) => void;
  multi?: boolean;
}) {
  const activo = (id: string) => (Array.isArray(valor) ? valor.includes(id) : valor === id);

  const alPulsar = (id: string) => {
    if (multi && Array.isArray(valor)) {
      onChange(valor.includes(id) ? valor.filter((v) => v !== id) : [...valor, id]);
    } else {
      onChange(id);
    }
  };

  return (
    <View style={styles.grupo}>
      <Text style={styles.titulo}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
        {opciones.map((o) => (
          <SoftPressable
            key={o.id}
            onPress={() => alPulsar(o.id)}
            style={[styles.chip, activo(o.id) && styles.chipActivo]}
          >
            <Text style={[styles.texto, activo(o.id) && styles.textoActivo]}>{o.label}</Text>
          </SoftPressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 10 },
  titulo: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase' },
  fila: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgAlt,
  },
  chipActivo: { backgroundColor: colors.lavanda },
  texto: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  textoActivo: { color: '#fff' },
});
