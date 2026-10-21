/**
 * Cálculo del Nutri-Score (algoritmo FSA-NPS 2023) para rellenar el grado en productos que no lo
 * traen pero sí tienen valores nutricionales. Las tablas son las EXACTAS del código de Open Food
 * Facts (la misma fuente que calculó los grados que ya vienen en la base), para que los estimados
 * sean consistentes con los oficiales.
 *
 * Referencias:
 *  - Open Food Facts, ProductOpener/Nutriscore.pm (tablas 2023)
 *  - Santé Publique France, actualización del algoritmo (dic 2023)
 */

export interface DatosNutri {
  kcal?: number;
  saturadas?: number;
  azucares?: number;
  fibra?: number;
  proteinas?: number;
  sal?: number;
}

// --- Tablas de puntos (2023) ---
const NEG = {
  energia: [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350], // kJ, 0-10
  azucares: [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51], // g, 0-15
  saturadas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // g, 0-10
  sal: [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4], // g, 0-20
};
const POS = {
  fibra: [3.0, 4.1, 5.2, 6.3, 7.4], // g, 0-5
  proteinas: [2.4, 4.8, 7.2, 9.6, 12, 14, 17], // g, 0-7
};
const BEB = {
  energia: [30, 90, 150, 210, 240, 270, 300, 330, 360, 390], // kJ, 0-10
  azucares: [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11], // g, 0-10
  proteinas: [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0], // g, 0-7
};

const KCAL_A_KJ = 4.184;

/** Puntos = nº de umbrales que el valor SUPERA (≤ primer umbral = 0 puntos). */
function puntos(valor: number, umbrales: number[]): number {
  let p = 0;
  for (const u of umbrales) if (valor > u) p++;
  return p;
}

function esBebida(categoria: string): boolean {
  const c = categoria.toLowerCase();
  return /bebida|beverage|refresco|zumo|agua|drink|infusi|juice|soda/.test(c);
}
function esAgua(categoria: string): boolean {
  return /\bagua\b|water/.test(categoria.toLowerCase());
}
function esQueso(categoria: string): boolean {
  return /queso|cheese/.test(categoria.toLowerCase());
}

function grado(score: number, tabla: 'alimento' | 'bebida'): 'a' | 'b' | 'c' | 'd' | 'e' {
  if (tabla === 'bebida') {
    if (score <= 2) return 'b';
    if (score <= 6) return 'c';
    if (score <= 9) return 'd';
    return 'e';
  }
  if (score <= 0) return 'a';
  if (score <= 2) return 'b';
  if (score <= 10) return 'c';
  if (score <= 18) return 'd';
  return 'e';
}

/**
 * Devuelve 'a'..'e' o null si faltan datos para calcularlo con un mínimo de fiabilidad.
 * No estima frutas/verduras/legumbres (no está en la base): se cuentan como 0, lo que hace la
 * estimación algo conservadora (nunca mejor de lo real) en productos con mucha fruta/verdura.
 */
export function calcularNutriScore(n: DatosNutri, categoria = ''): 'a' | 'b' | 'c' | 'd' | 'e' | null {
  // Datos mínimos imprescindibles
  if (n.kcal == null || n.azucares == null || n.saturadas == null || n.sal == null || n.proteinas == null) {
    return null;
  }
  const kj = n.kcal * KCAL_A_KJ;
  const fibra = n.fibra ?? 0;

  if (esBebida(categoria)) {
    if (esAgua(categoria)) return 'a';
    const neg = puntos(kj, BEB.energia) + puntos(n.azucares, BEB.azucares);
    const pos = puntos(n.proteinas, BEB.proteinas); // FVL desconocido = 0
    return grado(neg - pos, 'bebida');
  }

  const neg =
    puntos(kj, NEG.energia) +
    puntos(n.azucares, NEG.azucares) +
    puntos(n.saturadas, NEG.saturadas) +
    puntos(n.sal, NEG.sal);

  const ptFibra = puntos(fibra, POS.fibra);
  const ptProt = puntos(n.proteinas, POS.proteinas);

  // Regla 2023: si los puntos negativos ≥ 11 y no es queso, las proteínas no cuentan (sí la fibra).
  const contarProteinas = neg < 11 || esQueso(categoria);
  const pos = ptFibra + (contarProteinas ? ptProt : 0); // FVL desconocido = 0

  return grado(neg - pos, 'alimento');
}
