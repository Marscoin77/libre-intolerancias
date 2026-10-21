import { IntoleranciaId } from '../data/intolerancias';
import { CADENAS } from '../data/cadenas';
import { buscarProductosCadena as offCadena, buscarProductosTexto as offTexto } from './openFoodFacts';
import { consultarProductos, supabaseConfigurado } from './supabase';

export type { PaginaProductos, FiltrosDb, OrdenDb } from './supabase';
export { consultarProductos, supabaseConfigurado } from './supabase';

/**
 * Catálogo online: usa la base de datos propia (Supabase) si está configurada y, si no,
 * cae a Open Food Facts en directo.
 */
export function buscarProductosTexto(texto: string, intolerancias: IntoleranciaId[], pagina = 1) {
  return supabaseConfigurado
    ? consultarProductos({ texto, intolerancias, pagina })
    : offTexto(texto, intolerancias, pagina);
}

export function buscarProductosCadena(cadenaId: string, intolerancias: IntoleranciaId[], pagina = 1) {
  if (supabaseConfigurado) return consultarProductos({ supermercadoId: cadenaId, intolerancias, pagina });
  const tag = CADENAS.find((c) => c.id === cadenaId)?.tagOff ?? cadenaId;
  return offCadena(tag, intolerancias, pagina);
}
