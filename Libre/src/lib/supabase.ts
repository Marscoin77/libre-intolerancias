import { CATALOGO_API_URL } from '../config';
import { CADENAS } from '../data/cadenas';
import { IntoleranciaId } from '../data/intolerancias';
import { Producto } from '../data/productos';
import { limpiarTexto } from './texto';
import { traducirCategoria } from './categorias';
import { calcularNutriScore } from './nutriscore';

/**
 * Capa de datos del catálogo de productos.
 * Desde la migración a Cloudflare, consulta el Worker `libre-api` (D1) en lugar de Supabase.
 * El Worker devuelve las filas con la MISMA forma que devolvía PostgREST, así que el mapeo
 * (`aProducto`) no cambia.
 */
export const supabaseConfigurado = CATALOGO_API_URL.length > 0;

/** Etiquetas de alérgeno de la base (sin prefijo "en:") ↔ nuestras intolerancias */
const ALERGENO_A_ID: Record<string, IntoleranciaId> = {
  gluten: 'gluten',
  milk: 'lactosa',
  eggs: 'huevo',
  fish: 'pescado',
  crustaceans: 'marisco',
  molluscs: 'marisco',
  nuts: 'frutos_secos',
  soybeans: 'soja',
  peanuts: 'cacahuete',
  'sesame-seeds': 'sesamo',
  mustard: 'mostaza',
  celery: 'apio',
  'sulphur-dioxide-and-sulphites': 'sulfitos',
  lupin: 'altramuces',
};

interface Fila {
  ean: string;
  nombre: string;
  marca: string | null;
  cantidad_texto: string | null;
  categorias: string[] | null;
  ingredientes: string | null;
  alergenos: string[] | null;
  trazas: string[] | null;
  nutriscore: string | null;
  foto_frontal_mini_url: string | null;
  foto_frontal_url: string | null;
  foto_ingredientes_url: string | null;
  foto_nutricion_url: string | null;
  energia_kcal_100g: number | null;
  grasas_100g: number | null;
  saturadas_100g: number | null;
  hidratos_100g: number | null;
  azucares_100g: number | null;
  fibra_100g: number | null;
  proteinas_100g: number | null;
  sal_100g: number | null;
  precio: number | string | null;
  precio_tipo: 'real' | 'estimado' | null;
  precio_fecha: string | null;
  producto_supermercado?: Array<{ supermercado_id: string }>;
}

const aIds = (tags: string[] | null): IntoleranciaId[] =>
  [...new Set((tags ?? []).map((t) => ALERGENO_A_ID[t]).filter((x): x is IntoleranciaId => Boolean(x)))];

const nombreCadena = (id: string) => CADENAS.find((c) => c.id === id)?.nombreCatalogo || id;

const num = (v: number | null) => (v == null ? undefined : Number(v));

function aProducto(f: Fila): Producto {
  const categoria = limpiarTexto((f.categorias?.[0] ?? '').replace(/^\w\w:/, '').replace(/-/g, ' '));
  const nombre = limpiarTexto(f.nombre);
  const marca = limpiarTexto(f.marca);
  const hayNutricion = f.energia_kcal_100g != null || f.proteinas_100g != null || f.hidratos_100g != null;
  const nutricion = hayNutricion
    ? {
        kcal: num(f.energia_kcal_100g),
        grasas: num(f.grasas_100g),
        saturadas: num(f.saturadas_100g),
        hidratos: num(f.hidratos_100g),
        azucares: num(f.azucares_100g),
        fibra: num(f.fibra_100g),
        proteinas: num(f.proteinas_100g),
        sal: num(f.sal_100g),
      }
    : undefined;

  // Si no viene Nutri-Score pero hay valores nutricionales, se calcula (marcado como estimado).
  let nutriscore = f.nutriscore ?? undefined;
  let nutriscoreEstimado = false;
  if (!nutriscore && nutricion) {
    const calculado = calcularNutriScore(nutricion, (f.categorias ?? []).join(' '));
    if (calculado) {
      nutriscore = calculado;
      nutriscoreEstimado = true;
    }
  }

  return {
    id: `db-${f.ean}`,
    nombre: marca ? `${nombre} · ${marca}` : nombre,
    categoria: traducirCategoria(categoria),
    codigoBarras: f.ean,
    ingredientes: limpiarTexto(f.ingredientes) || 'Ingredientes no disponibles.',
    alergenos: aIds(f.alergenos),
    trazas: aIds(f.trazas),
    precioAprox: f.precio != null ? Number(f.precio) : 0,
    precioTipo: f.precio_tipo ?? undefined,
    calidad: 3,
    supermercados: (f.producto_supermercado ?? []).map((s) => nombreCadena(s.supermercado_id)),
    nutriscore,
    nutriscoreEstimado,
    datosIncompletos: !f.ingredientes,
    imagen: f.foto_frontal_mini_url ?? f.foto_frontal_url ?? undefined,
    fotoGrande: f.foto_frontal_url ?? undefined,
    fotoIngredientes: f.foto_ingredientes_url ?? undefined,
    fotoNutricion: f.foto_nutricion_url ?? undefined,
    nutricion,
    fuente: 'Open Food Facts / Open Prices (ODbL), base de datos de Libre',
    fechaVerificacion: f.precio_fecha ?? 'Desconocida',
  };
}

export interface PaginaProductos {
  productos: Producto[];
  total: number;
}

export type OrdenDb = 'relevancia' | 'precio' | 'nombre' | 'nutriscore';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch con timeout y un reintento. Evita que un arranque en frío del Worker (o un fallo
 * transitorio de red al abrir la app) deje la pantalla en "sin conexión" mostrando solo el
 * catálogo local: si la primera petición tarda o falla, se reintenta automáticamente.
 */
async function fetchConReintento(url: string, intentos = 2, timeoutMs = 10000): Promise<Response> {
  let ultimoError: unknown = new Error('Catálogo: sin respuesta');
  for (let i = 0; i < intentos; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if ((res.status >= 500 || res.status === 408 || res.status === 429) && i < intentos - 1) {
        ultimoError = new Error(`Catálogo: ${res.status}`);
        await esperar(500 * (i + 1));
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(t);
      ultimoError = e;
      if (i < intentos - 1) await esperar(500 * (i + 1));
    }
  }
  throw ultimoError instanceof Error ? ultimoError : new Error('Catálogo: sin respuesta');
}

export interface FiltrosDb {
  texto?: string;
  supermercadoId?: string;
  /** Etiqueta de categoría de Open Food Facts, p. ej. "en:dairies" */
  categoriaTag?: string;
  precioMax?: number;
  nutriscore?: string[];
  orden?: OrdenDb;
  intolerancias: IntoleranciaId[];
  /** Excluir productos cuyos alérgenos declarados coincidan con las intolerancias */
  excluirAlergenos?: boolean;
  /** Excluir además los que puedan contener trazas */
  excluirTrazas?: boolean;
  pagina?: number;
  /** Pedir el total exacto de resultados. Es costoso, así que el Worker solo lo calcula en la página 1. */
  contar?: boolean;
}

/**
 * Consulta de productos en el Worker de Cloudflare (D1). Solo se pueden excluir los alérgenos
 * que la base conoce (los 14 oficiales); fructosa, ajo, tomate, etc. no se filtran aquí.
 */
export async function consultarProductos({
  texto,
  supermercadoId,
  categoriaTag,
  precioMax,
  nutriscore,
  orden = 'relevancia',
  intolerancias,
  excluirAlergenos = true,
  excluirTrazas = false,
  pagina = 1,
  contar = true,
}: FiltrosDb): Promise<PaginaProductos> {
  const p = new URLSearchParams();
  if (texto) p.set('texto', texto);
  if (supermercadoId) p.set('supermercadoId', supermercadoId);
  if (categoriaTag) p.set('categoriaTag', categoriaTag);
  if (precioMax && precioMax > 0) p.set('precioMax', String(precioMax));
  if (nutriscore && nutriscore.length > 0) p.set('nutriscore', nutriscore.join(','));
  if (orden) p.set('orden', orden);
  if (intolerancias.length > 0) p.set('intolerancias', intolerancias.join(','));
  p.set('excluirAlergenos', excluirAlergenos ? '1' : '0');
  p.set('excluirTrazas', excluirTrazas ? '1' : '0');
  p.set('pagina', String(pagina));
  p.set('contar', contar ? '1' : '0');

  const res = await fetchConReintento(`${CATALOGO_API_URL}/productos?${p.toString()}`);
  if (!res.ok) throw new Error(`Catálogo: ${res.status}`);
  const data = (await res.json()) as { productos: Fila[]; total: number };
  const total = Number(data.total);
  return {
    productos: (data.productos ?? []).map(aProducto),
    total: Number.isFinite(total) ? total : (data.productos ?? []).length,
  };
}
