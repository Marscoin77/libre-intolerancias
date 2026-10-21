import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Set de iconos vectoriales propio de Libre (estilo lineal, trazo redondeado), en vez de emojis.
 * Todos en un lienzo de 24×24. Uso: <Icono nombre="shield" tamano={22} color={colors.apto} />
 */
export type NombreIcono =
  | 'search' | 'pin' | 'pot' | 'camera' | 'user' | 'list' | 'barcode'
  | 'shield' | 'warn' | 'no' | 'question'
  | 'home' | 'heart' | 'back' | 'chevron' | 'star' | 'plus' | 'filter'
  | 'close' | 'store' | 'map' | 'check';

type P = { c: string; w: number };

const ICONOS: Record<NombreIcono, (p: P) => React.ReactNode> = {
  search: ({ c, w }) => (<>
    <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={w} />
    <Line x1={16.5} y1={16.5} x2={21} y2={21} stroke={c} strokeWidth={w} strokeLinecap="round" />
  </>),
  pin: ({ c, w }) => (<>
    <Path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    <Circle cx={12} cy={10} r={2.6} stroke={c} strokeWidth={w} />
  </>),
  pot: ({ c, w }) => (<>
    <Path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    <Path d="M4 9 3 7m18 2 1-2M9 5.5C9 4 10 3.5 10 3m4 2.5C14 4 15 3.5 15 3" stroke={c} strokeWidth={w} strokeLinecap="round" />
  </>),
  camera: ({ c, w }) => (<>
    <Path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    <Circle cx={12} cy={13} r={3.4} stroke={c} strokeWidth={w} />
  </>),
  user: ({ c, w }) => (<>
    <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={w} />
    <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke={c} strokeWidth={w} strokeLinecap="round" />
  </>),
  list: ({ c, w }) => (<>
    <Path d="M8 6h12M8 12h12M8 18h12" stroke={c} strokeWidth={w} strokeLinecap="round" />
    <Circle cx={4} cy={6} r={1} fill={c} />
    <Circle cx={4} cy={12} r={1} fill={c} />
    <Circle cx={4} cy={18} r={1} fill={c} />
  </>),
  barcode: ({ c, w }) => (
    <Path d="M4 6v12M8 6v12M12 6v12M16 6v12M20 6v12" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  shield: ({ c, w }) => (<>
    <Path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    <Path d="m9 12 2 2 4-4" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>),
  warn: ({ c, w }) => (<>
    <Path d="M12 4 2.5 20h19L12 4Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    <Line x1={12} y1={10} x2={12} y2={14} stroke={c} strokeWidth={w} strokeLinecap="round" />
    <Circle cx={12} cy={17} r={0.6} fill={c} stroke={c} strokeWidth={w} />
  </>),
  no: ({ c, w }) => (<>
    <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={w} />
    <Line x1={8} y1={8} x2={16} y2={16} stroke={c} strokeWidth={w} strokeLinecap="round" />
    <Line x1={16} y1={8} x2={8} y2={16} stroke={c} strokeWidth={w} strokeLinecap="round" />
  </>),
  question: ({ c, w }) => (<>
    <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={w} />
    <Path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.6-2 1.9-2 3.2" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={17} r={0.6} fill={c} stroke={c} strokeWidth={w} />
  </>),
  home: ({ c, w }) => (<>
    <Path d="M4 11 12 4l8 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 10v9h12v-9" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>),
  heart: ({ c, w }) => (
    <Path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.5 12 20 12 20Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
  ),
  back: ({ c, w }) => (
    <Path d="M15 5l-7 7 7 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevron: ({ c, w }) => (
    <Path d="M9 5l7 7-7 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
  star: ({ c, w }) => (
    <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
  ),
  plus: ({ c, w }) => (
    <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  filter: ({ c, w }) => (
    <Path d="M4 6h16M7 12h10M10 18h4" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  close: ({ c, w }) => (
    <Path d="M6 6l12 12M18 6 6 18" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  store: ({ c, w }) => (<>
    <Path d="M4 9l1-4h14l1 4M5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" stroke={c} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
    <Path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" stroke={c} strokeWidth={w} strokeLinejoin="round" />
  </>),
  map: ({ c, w }) => (<>
    <Path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    <Path d="M9 4v14M15 6v14" stroke={c} strokeWidth={w} />
  </>),
  check: ({ c, w }) => (
    <Path d="M5 12l4.5 4.5L19 7" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
};

export default function Icono({
  nombre,
  tamano = 24,
  color = colors.textDark,
  grosor = 1.9,
}: {
  nombre: NombreIcono;
  tamano?: number;
  color?: string;
  grosor?: number;
}) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      {ICONOS[nombre]({ c: color, w: grosor })}
    </Svg>
  );
}
