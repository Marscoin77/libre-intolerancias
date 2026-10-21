import { Cadena, cadenaDe } from '../data/cadenas';

export interface Tienda {
  id: string;
  nombre: string;
  cadena: Cadena;
  lat: number;
  lon: number;
  direccion?: string;
  horario?: string;
}

export interface Bounds {
  sur: number;
  oeste: number;
  norte: number;
  este: number;
}

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

// Por debajo de este tamaño de vista (grados) pedimos datos; más lejos el mapa pide acercar.
// Áreas grandes en ciudades como Madrid o Barcelona hacen que Overpass agote el tiempo.
export const MAX_SPAN_GRADOS = 0.25;

const cache = new Map<string, Tienda[]>();

function claveCelda(b: Bounds) {
  return [b.sur, b.oeste, b.norte, b.este].map((n) => n.toFixed(2)).join(',');
}

/** Redondea el área hacia fuera a una rejilla de 0.05° para reutilizar caché al desplazar el mapa. */
export function redondear(b: Bounds): Bounds {
  const p = 0.05;
  return {
    sur: Math.floor(b.sur / p) * p,
    oeste: Math.floor(b.oeste / p) * p,
    norte: Math.ceil(b.norte / p) * p,
    este: Math.ceil(b.este / p) * p,
  };
}

export async function cargarSupermercados(area: Bounds, signal?: AbortSignal): Promise<Tienda[]> {
  const b = redondear(area);
  const clave = claveCelda(b);
  const previo = cache.get(clave);
  if (previo) return previo;

  const bbox = `${b.sur},${b.oeste},${b.norte},${b.este}`;
  const consulta = `[out:json][timeout:25];(nwr["shop"="supermarket"](${bbox});nwr["shop"="convenience"]["brand"](${bbox}););out center tags 1500;`;

  let ultimoError: unknown;
  for (const url of ENDPOINTS) {
    // Cada servidor tiene su propio límite de tiempo para no quedarse colgado en uno caído
    const ctrl = new AbortController();
    let agotado = false;
    const timer = setTimeout(() => {
      agotado = true;
      ctrl.abort();
    }, 20000);
    const alAbortar = () => ctrl.abort();
    signal?.addEventListener('abort', alAbortar);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(consulta)}`,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`${new URL(url).host} respondió ${res.status}`);
      const data = await res.json();
      if (data.remark && /error|timed out|out of memory/i.test(data.remark)) {
        throw new Error(`${new URL(url).host}: ${data.remark}`);
      }
      const tiendas: Tienda[] = [];
      for (const el of data.elements ?? []) {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null) continue;
        const tags = el.tags ?? {};
        const cadena = cadenaDe(tags);
        const calle = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
        const ciudad = tags['addr:city'];
        tiendas.push({
          id: `${el.type}/${el.id}`,
          nombre: tags.name || tags.brand || cadena.nombre,
          cadena,
          lat,
          lon,
          direccion: [calle, ciudad].filter(Boolean).join(', ') || undefined,
          horario: tags.opening_hours,
        });
      }
      cache.set(clave, tiendas);
      return tiendas;
    } catch (e) {
      if (signal?.aborted) throw e;
      ultimoError = agotado ? new Error(`${new URL(url).host} no respondió a tiempo`) : e;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', alAbortar);
    }
  }
  throw ultimoError ?? new Error('No se pudo consultar OpenStreetMap');
}

export function distanciaKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
