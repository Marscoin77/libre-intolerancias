/**
 * Capa de datos del "Mapa de la comunidad": restaurantes aportados por los usuarios y sus
 * valoraciones. Desde la migración a Cloudflare, habla con el Worker `libre-api` (D1) en vez de
 * Supabase.
 *
 * Identidad anónima: no hay login con contraseña. Cada móvil genera una vez un id de usuario
 * (UUID) y lo guarda en AsyncStorage; se envía en cada escritura para atribuir las aportaciones
 * (mismo propósito que el login anónimo que daba Supabase). Si algún día se añade login real,
 * se puede migrar este id.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATALOGO_API_URL } from '../config';
import { IntoleranciaId } from '../data/intolerancias';

const API = CATALOGO_API_URL;
const CLAVE_USUARIO = 'libre-usuario-id';
let usuarioMem: string | null = null;

// ----------------------------------------------------------------------------
// Tipos (idénticos a los de antes, para no tocar las pantallas)
// ----------------------------------------------------------------------------
/** Análisis automático de la web del restaurante (lo rellena el rastreador OSM). */
export type EstadoApto = 'apto' | 'dudoso' | 'no';
export interface AnalisisWeb {
  url: string;
  flags: Record<string, EstadoApto>;
  conciencia?: boolean;
  evidencias?: string[];
}

export interface RestauranteResumen {
  id: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  lat: number;
  lon: number;
  tipo_cocina: string | null;
  telefono: string | null;
  sitio_web: string | null;
  creado_por: string;
  creado_en: string;
  /** 'comunidad' (aportado por usuarios) u 'osm' (analizado automáticamente de su web). */
  fuente?: string;
  analisis?: AnalisisWeb | null;
  analisis_fecha?: string | null;
  media_estrellas: number;
  num_valoraciones: number;
}

export interface Valoracion {
  id: string;
  restaurante_id: string;
  usuario_id: string;
  estrellas: number;
  intolerancias_ok: IntoleranciaId[];
  comentario: string | null;
  creado_en: string;
  actualizado_en: string;
  /** Apodo del autor, resuelto por el servidor. */
  apodo?: string;
}

export interface NuevoRestaurante {
  nombre: string;
  direccion?: string;
  ciudad?: string;
  lat: number;
  lon: number;
  tipo_cocina?: string;
  telefono?: string;
  sitio_web?: string;
}

export interface Bounds {
  norte: number;
  sur: number;
  este: number;
  oeste: number;
}

// ----------------------------------------------------------------------------
// Utilidades HTTP
// ----------------------------------------------------------------------------
async function pedir<T>(ruta: string, opciones?: RequestInit, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    ...opciones,
    signal,
    headers: { 'Content-Type': 'application/json', ...(opciones?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string })?.error || `Error ${res.status}`);
  return data as T;
}

function uuid(): string {
  // UUID v4 sin depender de crypto nativo (suficiente para un id anónimo de dispositivo).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----------------------------------------------------------------------------
// Sesión (id anónimo de dispositivo) y apodo
// ----------------------------------------------------------------------------

/** Garantiza que hay un id de usuario anónimo y lo devuelve. */
export async function asegurarSesion(): Promise<string> {
  if (usuarioMem) return usuarioMem;
  let id = await AsyncStorage.getItem(CLAVE_USUARIO);
  if (!id) {
    id = uuid();
    await AsyncStorage.setItem(CLAVE_USUARIO, id);
  }
  usuarioMem = id;
  return id;
}

/** Id de usuario si ya existe, sin crearlo. */
export async function usuarioActual(): Promise<string | null> {
  if (usuarioMem) return usuarioMem;
  const id = await AsyncStorage.getItem(CLAVE_USUARIO);
  usuarioMem = id;
  return id;
}

export async function obtenerApodo(usuarioId: string): Promise<string | null> {
  const r = await pedir<{ apodo: string | null }>(`/perfil?usuarioId=${encodeURIComponent(usuarioId)}`);
  return r.apodo ?? null;
}

export async function guardarApodo(apodo: string): Promise<void> {
  const usuarioId = await asegurarSesion();
  await pedir('/perfil', { method: 'POST', body: JSON.stringify({ usuarioId, apodo: apodo.trim() }) });
}

// ----------------------------------------------------------------------------
// Restaurantes
// ----------------------------------------------------------------------------

/** Carga los restaurantes cuya posición cae dentro de la zona visible del mapa. */
export async function cargarRestaurantes(b: Bounds, signal?: AbortSignal): Promise<RestauranteResumen[]> {
  const qs = `norte=${b.norte}&sur=${b.sur}&este=${b.este}&oeste=${b.oeste}`;
  return pedir<RestauranteResumen[]>(`/restaurantes?${qs}`, undefined, signal);
}

export async function obtenerRestaurante(id: string): Promise<RestauranteResumen | null> {
  return pedir<RestauranteResumen | null>(`/restaurantes/${encodeURIComponent(id)}`);
}

/** Añade un restaurante y devuelve su id. Crea la sesión anónima si hace falta. */
export async function anadirRestaurante(r: NuevoRestaurante): Promise<string> {
  const usuarioId = await asegurarSesion();
  const res = await pedir<{ id: string }>('/restaurantes', {
    method: 'POST',
    body: JSON.stringify({ ...r, usuarioId }),
  });
  return res.id;
}

// ----------------------------------------------------------------------------
// Valoraciones
// ----------------------------------------------------------------------------

/** Crea o actualiza (una por usuario y restaurante) la valoración del usuario. */
export async function valorar(
  restauranteId: string,
  estrellas: number,
  intoleranciasOk: IntoleranciaId[]
): Promise<void> {
  const usuarioId = await asegurarSesion();
  await pedir('/valoraciones', {
    method: 'POST',
    body: JSON.stringify({ restauranteId, usuarioId, estrellas, intoleranciasOk }),
  });
}

/** Valoraciones de un restaurante, con el apodo del autor ya resuelto por el servidor. */
export async function cargarValoraciones(restauranteId: string): Promise<Valoracion[]> {
  return pedir<Valoracion[]>(`/valoraciones?restauranteId=${encodeURIComponent(restauranteId)}`);
}

/** La valoración del propio usuario para un restaurante, para prellenar el formulario. */
export async function miValoracion(restauranteId: string): Promise<Valoracion | null> {
  const usuarioId = await usuarioActual();
  if (!usuarioId) return null;
  return pedir<Valoracion | null>(
    `/valoraciones/mia?restauranteId=${encodeURIComponent(restauranteId)}&usuarioId=${encodeURIComponent(usuarioId)}`
  );
}

// ----------------------------------------------------------------------------
// Moderación
// ----------------------------------------------------------------------------

export async function reportar(
  objetoTipo: 'restaurante' | 'valoracion',
  objetoId: string,
  motivo: string
): Promise<void> {
  const usuarioId = await asegurarSesion();
  await pedir('/reportes', {
    method: 'POST',
    body: JSON.stringify({ objetoTipo, objetoId, usuarioId, motivo }),
  });
}
