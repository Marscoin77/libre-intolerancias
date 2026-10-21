import { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

// Propiedades que afectan a cómo se coloca el botón dentro de su contenedor: van al Pressable
// exterior. El resto (fondo, padding, filas internas…) se aplica a la vista animada interior.
const CLAVES_EXTERIORES = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
]);

/** Pressable que se encoge ligeramente al pulsar y vuelve con un muelle suave. */
export default function SoftPressable({
  style,
  children,
  escala = 0.96,
  haptica = false,
  onPressIn,
  onPressOut,
  ...resto
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  escala?: number;
  /** Vibración sutil al pulsar. Actívala en acciones principales (tarjetas, botones). */
  haptica?: boolean;
}) {
  const valor = useRef(new Animated.Value(1)).current;
  const animar = (a: number) =>
    Animated.spring(valor, { toValue: a, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const plano = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const exterior: Record<string, unknown> = {};
  const interior: Record<string, unknown> = {};
  for (const k of Object.keys(plano)) (CLAVES_EXTERIORES.has(k) ? exterior : interior)[k] = plano[k];

  return (
    <Pressable
      {...resto}
      style={exterior as ViewStyle}
      onPressIn={(e) => {
        animar(escala);
        if (haptica) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animar(1);
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[interior as ViewStyle, { flexGrow: 1, transform: [{ scale: valor }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
