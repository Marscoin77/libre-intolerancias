export interface Cadena {
  id: string;
  nombre: string;
  /** Nombre usado en PRODUCTOS[].supermercados */
  nombreCatalogo: string;
  color: string;
  /** Etiqueta `stores` de Open Food Facts */
  tagOff: string;
  /** Se prueba contra brand/name/operator de OpenStreetMap (sin tildes, minúsculas) */
  patron: RegExp;
}

export const CADENAS: Cadena[] = [
  { id: 'mercadona', nombre: 'Mercadona', nombreCatalogo: 'Mercadona', color: '#1E824C', tagOff: 'mercadona', patron: /mercadona/ },
  { id: 'carrefour', nombre: 'Carrefour', nombreCatalogo: 'Carrefour', color: '#1F5FBF', tagOff: 'carrefour', patron: /carrefour/ },
  { id: 'lidl', nombre: 'Lidl', nombreCatalogo: 'Lidl', color: '#F2C200', tagOff: 'lidl', patron: /lidl/ },
  { id: 'dia', nombre: 'Dia', nombreCatalogo: 'Dia', color: '#E2231A', tagOff: 'dia', patron: /\bdia\b/ },
  { id: 'alcampo', nombre: 'Alcampo', nombreCatalogo: 'Alcampo', color: '#E63946', tagOff: 'alcampo', patron: /alcampo/ },
  { id: 'eroski', nombre: 'Eroski', nombreCatalogo: 'Eroski', color: '#D6202F', tagOff: 'eroski', patron: /eroski/ },
  { id: 'aldi', nombre: 'Aldi', nombreCatalogo: 'Aldi', color: '#00A0DF', tagOff: 'aldi', patron: /\baldi\b/ },
  { id: 'elcorteingles', nombre: 'El Corte Inglés', nombreCatalogo: 'El Corte Inglés', color: '#2E7D32', tagOff: 'el-corte-ingles', patron: /corte ingles|supercor|hipercor/ },
  { id: 'consum', nombre: 'Consum', nombreCatalogo: 'Consum', color: '#F28C00', tagOff: 'consum', patron: /consum/ },
  { id: 'bonpreu', nombre: 'Bon Preu / Esclat', nombreCatalogo: 'Bon Preu', color: '#C8102E', tagOff: 'bonpreu', patron: /bon ?preu|esclat/ },
  { id: 'caprabo', nombre: 'Caprabo', nombreCatalogo: 'Caprabo', color: '#E4002B', tagOff: 'caprabo', patron: /caprabo/ },
  { id: 'condis', nombre: 'Condis', nombreCatalogo: 'Condis', color: '#E30613', tagOff: 'condis', patron: /condis/ },
  { id: 'gadis', nombre: 'Gadis', nombreCatalogo: 'Gadis', color: '#0072BC', tagOff: 'gadis', patron: /gadis/ },
  { id: 'ahorramas', nombre: 'Ahorramás', nombreCatalogo: 'Ahorramás', color: '#E30613', tagOff: 'ahorramas', patron: /ahorramas/ },
  { id: 'supersol', nombre: 'Supersol', nombreCatalogo: 'Supersol', color: '#F39200', tagOff: 'supersol', patron: /supersol|super sol/ },
  { id: 'alimerka', nombre: 'Alimerka', nombreCatalogo: 'Alimerka', color: '#E30613', tagOff: 'alimerka', patron: /alimerka/ },
  { id: 'coviran', nombre: 'Coviran', nombreCatalogo: 'Coviran', color: '#E2001A', tagOff: 'coviran', patron: /covir[aá]n/ },
  { id: 'spar', nombre: 'Spar', nombreCatalogo: 'Spar', color: '#D71920', tagOff: 'spar', patron: /\bspar\b/ },
  { id: 'hiperdino', nombre: 'HiperDino', nombreCatalogo: 'HiperDino', color: '#E30613', tagOff: 'hiperdino', patron: /hiperdino|dinosol/ },
  { id: 'froiz', nombre: 'Froiz', nombreCatalogo: 'Froiz', color: '#E30613', tagOff: 'froiz', patron: /froiz/ },
  { id: 'masymas', nombre: 'Masymas', nombreCatalogo: 'Masymas', color: '#E30613', tagOff: 'masymas', patron: /masymas|mas y mas/ },
  { id: 'family', nombre: 'Family Cash', nombreCatalogo: 'Family Cash', color: '#E30613', tagOff: 'family-cash', patron: /family cash/ },
  { id: 'bm', nombre: 'BM Supermercados', nombreCatalogo: 'BM', color: '#E30613', tagOff: 'bm-supermercados', patron: /\bbm\b|bm supermercados/ },
  { id: 'otros', nombre: 'Otros supermercados', nombreCatalogo: '', color: '#6B7A70', tagOff: '', patron: /$^/ },
];

const SIN_TILDES = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function cadenaDe(tags: Record<string, string | undefined>): Cadena {
  const texto = SIN_TILDES([tags.brand, tags.name, tags.operator].filter(Boolean).join(' | '));
  const otros = CADENAS[CADENAS.length - 1];
  return CADENAS.find((c) => c !== otros && c.patron.test(texto)) ?? otros;
}
