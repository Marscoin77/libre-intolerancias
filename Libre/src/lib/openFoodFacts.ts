import { IntoleranciaId } from '../data/intolerancias';
import { Producto } from '../data/productos';
import { limpiarTexto } from './texto';
import { traducirCategoria } from './categorias';

/**
 * Mapeo aproximado entre las etiquetas de alérgenos de Open Food Facts
 * y nuestras IntoleranciaId. Es deliberadamente conservador: si hay duda,
 * no se marca, y el producto queda como "sin datos suficientes".
 */
const MAPEO_ALERGENOS: Record<string, IntoleranciaId> = {
  'en:gluten': 'gluten',
  'en:milk': 'lactosa',
  'en:eggs': 'huevo',
  'en:fish': 'pescado',
  'en:crustaceans': 'marisco',
  'en:molluscs': 'marisco',
  'en:nuts': 'frutos_secos',
  'en:soybeans': 'soja',
  'en:peanuts': 'cacahuete',
  'en:sesame-seeds': 'sesamo',
  'en:mustard': 'mostaza',
  'en:celery': 'apio',
  'en:sulphur-dioxide-and-sulphites': 'sulfitos',
  'en:lupin': 'altramuces',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aProducto(p: any, codigoBarras: string, supermercados: string[] = []): Producto {
  const alergenosTags: string[] = p.allergens_tags ?? [];
  const trazasTags: string[] = p.traces_tags ?? [];

  const alergenos = alergenosTags
    .map((t) => MAPEO_ALERGENOS[t])
    .filter((x): x is IntoleranciaId => Boolean(x));
  const trazas = trazasTags
    .map((t) => MAPEO_ALERGENOS[t])
    .filter((x): x is IntoleranciaId => Boolean(x));

  return {
    id: `off-${codigoBarras}`,
    nombre: limpiarTexto(p.product_name) || 'Producto sin nombre',
    categoria: traducirCategoria(limpiarTexto(p.categories?.split(',')[0]?.replace(/^\w\w:/, '').replace(/-/g, ' '))),
    codigoBarras,
    ingredientes: limpiarTexto(p.ingredients_text) || 'Ingredientes no disponibles.',
    alergenos: [...new Set(alergenos)],
    trazas: [...new Set(trazas)],
    precioAprox: 0,
    calidad: 3,
    supermercados,
    imagen: p.image_front_small_url || p.image_small_url || undefined,
    fuente: 'Open Food Facts (comunidad, sin verificar por Libre)',
    fechaVerificacion: 'Desconocida',
  };
}

export async function buscarEnOpenFoodFacts(codigoBarras: string): Promise<Producto | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codigoBarras}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return aProducto(data.product, codigoBarras);
  } catch {
    return null;
  }
}

/** Etiquetas OFF de alérgeno que excluimos al buscar productos aptos (solo las que OFF conoce). */
const EXCLUSION_OFF: Partial<Record<IntoleranciaId, string[]>> = {
  gluten: ['gluten'],
  lactosa: ['milk'],
  huevo: ['eggs'],
  pescado: ['fish'],
  marisco: ['crustaceans', 'molluscs'],
  frutos_secos: ['nuts'],
  soja: ['soybeans'],
  cacahuete: ['peanuts'],
  sesamo: ['sesame-seeds'],
  mostaza: ['mustard'],
  apio: ['celery'],
  sulfitos: ['sulphur-dioxide-and-sulphites'],
  altramuces: ['lupin'],
};

const CAMPOS_OFF =
  'code,product_name,categories,ingredients_text,allergens_tags,traces_tags,image_front_small_url,image_small_url';

export interface PaginaProductos {
  productos: Producto[];
  total: number;
}

/**
 * Productos de Open Food Facts vendidos en una cadena (España), excluyendo los alérgenos
 * declarados de las intolerancias del usuario. Solo cubre lo que la comunidad ha subido.
 */
export function buscarProductosCadena(
  tagCadena: string,
  intolerancias: IntoleranciaId[],
  pagina = 1
): Promise<PaginaProductos> {
  return buscarOFF({ tagCadena, intolerancias, pagina });
}

/** Busca por texto libre en toda la base de Open Food Facts de España. */
export function buscarProductosTexto(
  texto: string,
  intolerancias: IntoleranciaId[],
  pagina = 1
): Promise<PaginaProductos> {
  return buscarOFF({ texto, intolerancias, pagina });
}

async function buscarOFF({
  tagCadena,
  texto,
  intolerancias,
  pagina,
}: {
  tagCadena?: string;
  texto?: string;
  intolerancias: IntoleranciaId[];
  pagina: number;
}): Promise<PaginaProductos> {
  const params = new URLSearchParams({
    action: 'process',
    json: '1',
    page_size: '24',
    page: String(pagina),
    sort_by: 'unique_scans_n',
    fields: CAMPOS_OFF,
  });
  if (texto) params.append('search_terms', texto);
  let i = 0;
  const filtro = (tipo: string, modo: 'contains' | 'does_not_contain', valor: string) => {
    params.append(`tagtype_${i}`, tipo);
    params.append(`tag_contains_${i}`, modo);
    params.append(`tag_${i}`, valor);
    i++;
  };
  if (tagCadena) filtro('stores', 'contains', tagCadena);
  filtro('countries', 'contains', 'en:spain');
  const excluidos = new Set(intolerancias.flatMap((t) => EXCLUSION_OFF[t] ?? []));
  excluidos.forEach((a) => filtro('allergens', 'does_not_contain', `en:${a}`));

  const res = await fetch(`https://es.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
  const data = await res.json();
  const productos: Producto[] = (data.products ?? [])
    .filter((p: { code?: string; product_name?: string }) => p.code && p.product_name)
    .map((p: { code: string }) => aProducto(p, p.code, tagCadena ? [tagCadena] : []));
  return { productos, total: Number(data.count ?? productos.length) };
}
