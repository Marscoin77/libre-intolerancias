import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { fuente } from '../theme';

const POR_PESO: Record<string, string> = {
  '400': fuente.regular,
  normal: fuente.regular,
  '500': fuente.medium,
  '600': fuente.semibold,
  '700': fuente.bold,
  bold: fuente.bold,
  '800': fuente.extrabold,
  '900': fuente.extrabold,
};

/**
 * Text con la tipografía de la app. Traduce `fontWeight` a la familia Poppins
 * correspondiente (en Android los pesos no se aplican a fuentes personalizadas).
 */
export function Text({ style, ...props }: TextProps) {
  const plano = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const familia = plano.fontFamily ?? POR_PESO[String(plano.fontWeight ?? '400')] ?? fuente.regular;
  return <RNText {...props} style={[style, { fontFamily: familia, fontWeight: undefined }]} />;
}
