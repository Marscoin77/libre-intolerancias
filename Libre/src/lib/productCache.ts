import { Producto } from '../data/productos';

/**
 * Caché en memoria para productos obtenidos en tiempo de ejecución
 * (p.ej. desde el escáner vía Open Food Facts) que no están en el
 * catálogo curado local, para poder abrir su ficha por id.
 */
const cache = new Map<string, Producto>();

export function guardarEnCache(producto: Producto) {
  cache.set(producto.id, producto);
}

export function obtenerDeCache(id: string): Producto | undefined {
  return cache.get(id);
}
