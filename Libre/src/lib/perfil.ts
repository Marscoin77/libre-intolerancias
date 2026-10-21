import AsyncStorage from '@react-native-async-storage/async-storage';
import { DietaId, IntoleranciaId } from '../data/intolerancias';

const KEY = 'libre:perfil';
const KEY_ALMACEN = 'libre:perfiles';

export const MAX_PERFILES = 4;
export const ID_PRINCIPAL = 'principal';

/** Avatares elegibles para cada miembro de la familia. El primero es el de por defecto. */
export const AVATARES = ['🙂', '👦', '👧', '🧒', '👶', '👩', '👨', '🧑', '👵', '👴', '🧔', '👩‍🦰'];

export interface Perfil {
  id: string;
  nombre: string;
  /** Emoji que representa al perfil en los chips. Uno de AVATARES. */
  avatar: string;
  /** Edad en años; null si no se ha indicado. Se usa para las recomendaciones por edad. */
  edad: number | null;
  intolerancias: IntoleranciaId[];
  dietas: DietaId[];
  preferencias: string;
  numPersonas: number;
  ubicacion: string;
  disclaimerAceptado: boolean;
}

export interface AlmacenPerfiles {
  activoId: string;
  perfiles: Perfil[];
}

export const PERFIL_VACIO: Perfil = {
  id: ID_PRINCIPAL,
  nombre: 'Yo',
  avatar: AVATARES[0],
  edad: null,
  intolerancias: [],
  dietas: [],
  preferencias: '',
  numPersonas: 1,
  ubicacion: '',
  disclaimerAceptado: false,
};

export const ALMACEN_VACIO: AlmacenPerfiles = { activoId: ID_PRINCIPAL, perfiles: [PERFIL_VACIO] };

export async function cargarAlmacen(): Promise<AlmacenPerfiles> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ALMACEN);
    if (raw) {
      const a = JSON.parse(raw) as AlmacenPerfiles;
      if (Array.isArray(a.perfiles) && a.perfiles.length > 0) {
        return {
          activoId: a.perfiles.some((p) => p.id === a.activoId) ? a.activoId : a.perfiles[0].id,
          perfiles: a.perfiles.map((p) => ({ ...PERFIL_VACIO, ...p })),
        };
      }
    }
    // Migración desde el perfil único de versiones anteriores
    const antiguo = await AsyncStorage.getItem(KEY);
    if (antiguo) {
      return { activoId: ID_PRINCIPAL, perfiles: [{ ...PERFIL_VACIO, ...JSON.parse(antiguo), id: ID_PRINCIPAL }] };
    }
  } catch {
    // se usa el almacén vacío
  }
  return ALMACEN_VACIO;
}

export async function guardarAlmacen(almacen: AlmacenPerfiles): Promise<void> {
  await AsyncStorage.setItem(KEY_ALMACEN, JSON.stringify(almacen));
}
