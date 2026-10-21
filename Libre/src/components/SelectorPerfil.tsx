import { ScrollView, StyleSheet } from 'react-native';
import { Text } from './Texto';
import { router } from 'expo-router';
import SoftPressable from './SoftPressable';
import { usePerfil } from '../lib/PerfilContext';
import { MAX_PERFILES } from '../lib/perfil';
import { colors } from '../theme';

/** Chips para cambiar de perfil activo; el último abre la gestión de perfiles. */
export default function SelectorPerfil() {
  const { perfiles, perfil, cambiarPerfil } = usePerfil();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      style={styles.scroll}
    >
      {perfiles.map((p) => (
        <SoftPressable
          key={p.id}
          onPress={() => cambiarPerfil(p.id)}
          style={[styles.chip, p.id === perfil.id && styles.chipActivo]}
        >
          <Text style={[styles.texto, p.id === perfil.id && styles.textoActivo]}>{p.avatar} {p.nombre}</Text>
        </SoftPressable>
      ))}
      {perfiles.length < MAX_PERFILES && (
        <SoftPressable onPress={() => router.push('/perfil')} style={styles.chip}>
          <Text style={styles.texto}>＋ Añadir perfil</Text>
        </SoftPressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flexShrink: 0 evita que la lista de abajo, al llenarse, aplaste esta fila de chips.
  scroll: { flexGrow: 0, flexShrink: 0, marginBottom: 14 },
  // paddingVertical da holgura para que el ScrollView horizontal no recorte los chips por abajo.
  fila: { gap: 8, alignItems: 'center', paddingVertical: 3 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.bgAlt,
  },
  chipActivo: { backgroundColor: colors.accent },
  // lineHeight explícito evita que se corten los descendentes ("p" de perfil) en Android.
  texto: { color: colors.textMutedOnDark, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  textoActivo: { color: '#fff' },
});
