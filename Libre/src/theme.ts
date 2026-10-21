import { Platform, ViewStyle } from 'react-native';

/**
 * Sistema de diseño de Libre.
 *
 * Paleta cálida (crema) con verde de marca fresco + lavanda, y un lenguaje de VEREDICTO
 * (apto / precaución / no apto) que no depende solo del color: cada estado lleva además icono
 * y forma (ver componente Veredicto). Se conservan los nombres de token antiguos para no romper
 * las pantallas; los valores están afinados.
 */
export const colors = {
  // Fondos y superficies
  bg: '#FAF6EF',
  bgAlt: '#EFEAF6',
  surface2: '#F3EEE4',
  card: '#FFFFFF',

  // Marca
  accent: '#0F9D78',
  accentSoft: '#D8F2E8',
  accentDeep: '#0A6B52',
  coral: '#FF6F5B',
  lavanda: '#7C6CF2',
  rosa: '#FF5C9A',
  sol: '#FFC233',

  // Texto y líneas (los *OnDark se conservan: son el texto/borde sobre el fondo claro)
  textOnDark: '#182B24',
  textMutedOnDark: '#6A776F',
  textDark: '#182B24',
  textMuted: '#6A776F',
  border: '#EBE3D6',
  borderOnDark: '#E8E1F0',

  // Avisos
  warningBg: '#FBEED0',
  warningBorder: '#F5D98A',
  warningText: '#8A5A00',
  dangerBg: '#FBE1DF',
  dangerText: '#DB423C',

  // Veredicto (color + fondo tintado para la insignia)
  apto: '#1F9D57',
  aptoBg: '#E3F5E9',
  precaucion: '#D98A0B',
  precaucionBg: '#FBEED0',
  noApto: '#DB423C',
  noAptoBg: '#FBE1DF',
  sinDatos: '#8793A0',
  sinDatosBg: '#EDF0F2',
};

/** Colores oficiales del Nutri-Score A→E. */
export const nutri: Record<string, string> = {
  a: '#258A50',
  b: '#86BC42',
  c: '#F4C13D',
  d: '#EE8100',
  e: '#E63E11',
};

/** Familias de Poppins cargadas en app/_layout.tsx, una por peso */
export const fuente = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
};

/** Escala de espaciado fija (múltiplos de 4). */
export const espacio = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

/** Sombra suave y difusa para tarjetas sobre el fondo crema */
export const sombra: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#2A3D33',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  default: { elevation: 3, shadowColor: '#2A3D33' },
}) as ViewStyle;

/** Sombra sutil para elementos pequeños (chips, insignias flotantes). */
export const sombraSuave: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#2A3D33',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  default: { elevation: 2, shadowColor: '#2A3D33' },
}) as ViewStyle;
