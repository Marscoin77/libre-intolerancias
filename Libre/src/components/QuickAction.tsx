import { View, StyleSheet } from 'react-native';
import { Text } from './Texto';
import SoftPressable from './SoftPressable';
import Icono, { NombreIcono } from './Icono';
import { colors, radius, sombraSuave } from '../theme';

/** Acceso rápido con icono vectorial sobre un fondo tintado. */
export default function QuickAction({
  icono,
  color,
  label,
  onPress,
  tinte = colors.accentSoft,
}: {
  icono: NombreIcono;
  color: string;
  label: string;
  onPress: () => void;
  tinte?: string;
}) {
  return (
    <SoftPressable style={styles.wrap} onPress={onPress} escala={0.92} haptica>
      <View style={[styles.circulo, { backgroundColor: tinte }]}>
        <Icono nombre={icono} tamano={24} color={color} grosor={2} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 72 },
  circulo: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...sombraSuave,
  },
  label: { fontSize: 11, color: colors.textOnDark, textAlign: 'center', fontWeight: '600', lineHeight: 14 },
});
