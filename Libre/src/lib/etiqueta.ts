import { IntoleranciaId } from '../data/intolerancias';
import { intoleranciasEnIngredientes } from './compatibilidad';

export type VeredictoEtiqueta = 'apto' | 'no_apto' | 'precaucion' | 'ilegible';

export interface LineaOcr {
  text: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface LineaMarcada {
  caja: LineaOcr['boundingBox'];
  nivel: 'rojo' | 'ambar';
}

export interface ResultadoEtiqueta {
  veredicto: VeredictoEtiqueta;
  /** Intolerancias del perfil que aparecen en los ingredientes */
  conflictos: IntoleranciaId[];
  /** Intolerancias del perfil que aparecen como "puede contener trazas de…" */
  trazas: IntoleranciaId[];
  marcas: LineaMarcada[];
  mensaje: string;
}

const SEPARADOR_TRAZAS = /(puede(?:n)? contener|contiene trazas|trazas de|trazas:|may contain|peut contenir)/i;

/** Corta el texto en "ingredientes" y "trazas" (todo lo que sigue a la primera frase de trazas). */
function separarTrazas(texto: string): { ingredientes: string; trazas: string } {
  const m = SEPARADOR_TRAZAS.exec(texto);
  if (!m) return { ingredientes: texto, trazas: '' };
  return { ingredientes: texto.slice(0, m.index), trazas: texto.slice(m.index) };
}

/**
 * Analiza el texto leído de una etiqueta contra las intolerancias del perfil.
 * Prioridades: alérgeno en ingredientes → NO APTO; trazas → PRECAUCIÓN; si la foto no permite
 * leer una lista de ingredientes → ILEGIBLE (nunca se da por apto un texto que no se ha leído).
 */
export function analizarEtiqueta(
  textoCompleto: string,
  lineas: LineaOcr[],
  intolerancias: IntoleranciaId[]
): ResultadoEtiqueta {
  const texto = textoCompleto.replace(/\s+/g, ' ').trim();
  const pareceEtiqueta = /ingredient|ingrédient|zutaten|contiene|alergen|composici/i.test(texto) || (texto.match(/,/g)?.length ?? 0) >= 5;

  if (texto.length < 30 || !pareceEtiqueta) {
    return {
      veredicto: 'ilegible',
      conflictos: [],
      trazas: [],
      marcas: [],
      mensaje:
        'No he podido leer una lista de ingredientes en la foto. Acércate a la etiqueta, con buena luz y sin reflejos, y vuelve a intentarlo. Mientras tanto, no lo des por apto.',
    };
  }

  if (intolerancias.length === 0) {
    return {
      veredicto: 'precaucion',
      conflictos: [],
      trazas: [],
      marcas: [],
      mensaje: 'Tu perfil no tiene intolerancias marcadas. Añádelas en Perfiles para poder comprobar la etiqueta.',
    };
  }

  const { ingredientes, trazas: textoTrazas } = separarTrazas(texto);
  const conflictos = intoleranciasEnIngredientes(ingredientes, intolerancias);
  const trazas = intoleranciasEnIngredientes(textoTrazas, intolerancias).filter((i) => !conflictos.includes(i));

  // Marcar las líneas concretas donde aparece cada palabra, para rodearlas en la foto
  const marcas: LineaMarcada[] = [];
  let enTrazas = false;
  for (const l of lineas) {
    if (SEPARADOR_TRAZAS.test(l.text)) enTrazas = true;
    const enLinea = intoleranciasEnIngredientes(l.text, intolerancias);
    if (enLinea.length === 0) continue;
    marcas.push({ caja: l.boundingBox, nivel: enTrazas ? 'ambar' : 'rojo' });
  }

  if (conflictos.length > 0) {
    return {
      veredicto: 'no_apto',
      conflictos,
      trazas,
      marcas,
      mensaje: 'Esta etiqueta menciona ingredientes de tu perfil. No lo consumas.',
    };
  }
  if (trazas.length > 0) {
    return {
      veredicto: 'precaucion',
      conflictos,
      trazas,
      marcas,
      mensaje: 'No aparecen en los ingredientes, pero puede contener trazas de alguna de tus intolerancias.',
    };
  }
  return {
    veredicto: 'apto',
    conflictos,
    trazas,
    marcas,
    mensaje:
      'No he encontrado ninguna de tus intolerancias en el texto leído. Comprueba tú mismo la etiqueta completa: la lectura de una foto puede fallar.',
  };
}
