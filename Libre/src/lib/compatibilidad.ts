import { IntoleranciaId, nombreIntolerancia } from '../data/intolerancias';
import { Producto } from '../data/productos';
import { colors } from '../theme';
import type { NombreIcono } from '../components/Icono';

export type Estado = 'apto' | 'precaucion' | 'no_apto';

export interface ResultadoCompatibilidad {
  estado: Estado;
  motivo: string;
  intoleranciasEnConflicto: IntoleranciaId[];
  fuente: string;
  fechaVerificacion: string;
}

/**
 * Palabras que, si aparecen en la lista de ingredientes, indican la presencia de una intolerancia
 * aunque el campo de alérgenos del producto esté vacío (los datos comunitarios están incompletos).
 * Se buscan sin tildes y al inicio de palabra. Incluye algunas formas en francés/portugués/inglés
 * porque hay fichas con ingredientes sin traducir.
 */
const PALABRAS: Partial<Record<IntoleranciaId, string[]>> = {
  gluten: ['trigo', 'cebada', 'centeno', 'avena', 'espelta', 'kamut', 'gluten', 'malta', 'semola', 'seitan', 'ble ', 'wheat', 'farine de ble'],
  lactosa: ['leche', 'lactosa', 'nata', 'mantequilla', 'queso', 'yogur', 'lactosuero', 'suero de leche', 'caseina', 'caseinato', 'requeson', 'kefir', 'mascarpone', 'lait', 'leite', 'milk', 'suero lacteo'],
  huevo: ['huevo', 'clara de', 'yema', 'ovoalbumina', 'albumina', 'oeuf', 'egg'],
  frutos_secos: ['frutos secos', 'fruto seco', 'frutos de cascara', 'nuts', 'almendra', 'avellana', 'nuez', 'nueces', 'anacardo', 'pistacho', 'pecana', 'macadamia', 'pinon', 'piñon'],
  cacahuete: ['cacahuete', 'cacahuate', 'mani'],
  soja: ['soja', 'soya'],
  pescado: ['pescado', 'atun', 'merluza', 'salmon', 'bacalao', 'anchoa', 'sardina', 'caballa', 'bonito', 'lubina', 'dorada', 'poisson'],
  marisco: ['marisco', 'gamba', 'langostino', 'cangrejo', 'mejillon', 'almeja', 'calamar', 'pulpo', 'sepia', 'crustace', 'molusco'],
  sesamo: ['sesamo', 'tahini', 'tahina'],
  mostaza: ['mostaza'],
  apio: ['apio'],
  sulfitos: ['sulfito', 'anhidrido sulfuroso', 'dioxido de azufre', 'e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228'],
  altramuces: ['altramuz', 'altramuces', 'lupin'],
  ajo: ['ajo'],
  cebolla: ['cebolla'],
  tomate: ['tomate'],
  maiz: ['maiz', 'almidon de maiz', 'jarabe de maiz'],
  legumbres: ['lenteja', 'garbanzo', 'judia', 'alubia', 'guisante', 'haba'],
  fructosa: ['fructosa', 'agave', 'miel'],
  sorbitol: ['sorbitol', 'e420'],
};

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Intolerancias cuyas palabras aparecen en los ingredientes (ignora "sin gluten", "sin lactosa"…) */
export function intoleranciasEnIngredientes(
  ingredientes: string,
  intolerancias: IntoleranciaId[]
): IntoleranciaId[] {
  if (!ingredientes || ingredientes.startsWith('Ingredientes no disponibles')) return [];
  const texto = sinTildes(ingredientes);
  const sinGluten = texto.includes('sin gluten');
  const encontradas: IntoleranciaId[] = [];

  for (const id of intolerancias) {
    const palabras = PALABRAS[id];
    if (!palabras) continue;
    const hay = palabras.some((p) => {
      const clave = sinTildes(p);
      // La avena "sin gluten" no cuenta como gluten
      if (id === 'gluten' && clave === 'avena' && sinGluten) return false;
      const fin = clave.length <= 4 ? 's?($|[^a-z])' : '';
      const re = new RegExp(`(^|[^a-z])${clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${fin}`, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(texto)) !== null) {
        const antes = texto.slice(Math.max(0, m.index - 12), m.index + m[1].length);
        if (!/(sin|libre de|exento de|sans)\s*$/.test(antes)) return true;
      }
      return false;
    });
    if (hay) encontradas.push(id);
  }
  return encontradas;
}

/**
 * "no_apto" pesa más que "precaucion": basta un alérgeno declarado (o citado en los ingredientes)
 * de cualquier intolerancia del perfil para descartar el producto, aunque otra intolerancia
 * del mismo producto solo tenga trazas. Un producto sin datos de ingredientes nunca se da por apto.
 */
export function evaluarCompatibilidad(
  producto: Producto,
  intoleranciasUsuario: IntoleranciaId[]
): ResultadoCompatibilidad {
  const base = {
    fuente: producto.fuente,
    fechaVerificacion: producto.fechaVerificacion,
  };

  if (intoleranciasUsuario.length === 0) {
    return {
      ...base,
      estado: 'apto',
      motivo: 'No has seleccionado intolerancias en tu perfil.',
      intoleranciasEnConflicto: [],
    };
  }

  const declarados = producto.alergenos.filter((a) => intoleranciasUsuario.includes(a));
  const enTexto = intoleranciasEnIngredientes(producto.ingredientes, intoleranciasUsuario).filter(
    (i) => !declarados.includes(i)
  );
  if (declarados.length > 0 || enTexto.length > 0) {
    const partes = [
      declarados.length > 0
        ? `Contiene ${declarados.map(nombreIntolerancia).join(', ')}, declarado en el etiquetado.`
        : '',
      enTexto.length > 0
        ? `Sus ingredientes mencionan ${enTexto.map(nombreIntolerancia).join(', ')}.`
        : '',
    ].filter(Boolean);
    return {
      ...base,
      estado: 'no_apto',
      motivo: partes.join(' '),
      intoleranciasEnConflicto: [...declarados, ...enTexto],
    };
  }

  const trazasConflicto = producto.trazas.filter((t) => intoleranciasUsuario.includes(t));
  if (trazasConflicto.length > 0) {
    return {
      ...base,
      estado: 'precaucion',
      motivo: `Puede contener trazas de ${trazasConflicto.map(nombreIntolerancia).join(', ')}.`,
      intoleranciasEnConflicto: trazasConflicto,
    };
  }

  if (producto.datosIncompletos) {
    return {
      ...base,
      estado: 'precaucion',
      motivo:
        'Este producto no tiene los ingredientes registrados, así que no podemos comprobarlo. Revisa siempre la etiqueta antes de consumirlo.',
      intoleranciasEnConflicto: [],
    };
  }

  return {
    ...base,
    estado: 'apto',
    motivo: 'No se han detectado alérgenos ni trazas relacionados con tu perfil, según los datos disponibles.',
    intoleranciasEnConflicto: [],
  };
}

export const ESTADO_INFO: Record<
  Estado,
  { emoji: string; etiqueta: string; etiquetaCorta: string; color: string; bg: string; icono: NombreIcono }
> = {
  apto: { emoji: '✅', etiqueta: 'APTO PARA TU PERFIL', etiquetaCorta: 'Apto', color: colors.apto, bg: colors.aptoBg, icono: 'shield' },
  precaucion: { emoji: '⚠️', etiqueta: 'PRECAUCIÓN', etiquetaCorta: 'Precaución', color: colors.precaucion, bg: colors.precaucionBg, icono: 'warn' },
  no_apto: { emoji: '❌', etiqueta: 'NO APTO', etiquetaCorta: 'No apto', color: colors.noApto, bg: colors.noAptoBg, icono: 'no' },
};
