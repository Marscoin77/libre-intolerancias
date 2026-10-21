/**
 * Conexión a los datos remotos.
 *
 * Todo vive ahora en Cloudflare: el catálogo de productos (solo lectura) y el mapa comunitario de
 * restaurantes (lectura + escritura con id anónimo de dispositivo) se sirven desde el mismo Worker
 * `libre-api` sobre D1. Es una API pública; no lleva claves.
 */
export const CATALOGO_API_URL = 'https://libre-api.adriagimenez238.workers.dev';
