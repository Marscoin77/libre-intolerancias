/**
 * Limpia texto procedente de fuentes externas (Open Food Facts, base de datos),
 * que a veces llega con etiquetas HTML (<span class="allergen">…</span>),
 * entidades (&quot;, &#39;, &amp;…) o los guiones bajos que OFF usa para marcar
 * alérgenos (_leche_). Devuelve texto plano legible.
 */

const ENTIDADES_NOMBRADAS: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  acirc: 'â', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û',
  ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç',
  uuml: 'ü', Uuml: 'Ü', ouml: 'ö', auml: 'ä',
  ordf: 'ª', ordm: 'º', deg: '°', euro: '€', pound: '£', cent: '¢',
  hellip: '…', ndash: '–', mdash: '—', laquo: '«', raquo: '»',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  middot: '·', bull: '•', trade: '™', reg: '®', copy: '©',
  frac12: '½', frac14: '¼', frac34: '¾', times: '×', divide: '÷',
};

/**
 * Reparaciones de mojibake inequívocas (UTF-8 mal decodificado). Solo secuencias que no aparecen
 * en texto correcto en español/portugués, para no corromper nada. No se toca la familia "Ã…"
 * porque "ã", "à"… sí son válidas en portugués/catalán.
 */
const MOJIBAKE: Array<[RegExp, string]> = [
  [/�/g, ''], // � carácter de reemplazo: dato perdido, se elimina
  [/Â­/g, ''], // guion suave sobrante
  [/Â /g, ' '], // Â + espacio duro → espacio
  [/Â°/g, '°'],
  [/Âº/g, 'º'],
  [/Âª/g, 'ª'],
  [/Â·/g, '·'],
  [/Â¡/g, '¡'],
  [/Â¿/g, '¿'],
  [/Â½/g, '½'],
  [/â€œ/g, '"'],
  [/â€\u009D/g, '"'],
  [/â€™/g, '’'],
  [/â€˜/g, '‘'],
  [/â€“/g, '–'],
  [/â€”/g, '—'],
  [/â€¦/g, '…'],
  [/â€¢/g, '·'],
];

export function limpiarTexto(valor: string | null | undefined): string {
  if (!valor) return '';
  let s = String(valor);

  // 0. Mojibake inequívoco
  for (const [re, rep] of MOJIBAKE) s = s.replace(re, rep);

  // 1. Etiquetas HTML → espacio
  s = s.replace(/<[^>]*>/g, ' ');

  // 2. Entidades numéricas (decimales y hexadecimales)
  s = s.replace(/&#(\d+);/g, (_, n: string) => codigoSeguro(Number(n)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => codigoSeguro(parseInt(n, 16)));

  // 3. Entidades nombradas frecuentes
  s = s.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, nombre: string) => ENTIDADES_NOMBRADAS[nombre] ?? m);

  // 4. Guiones bajos de OFF que marcan alérgenos: _leche_ → leche
  s = s.replace(/_([^_]+)_/g, '$1');

  // 5. Espacios sobrantes (incluye los que dejan las etiquetas quitadas)
  s = s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;.:%!?])/g, '$1') // espacio antes de puntuación
    .replace(/([([{])\s+/g, '$1') // espacio tras abrir paréntesis/corchete
    .replace(/\s+([)\]}])/g, '$1') // espacio antes de cerrar
    .trim();

  return s;
}

function codigoSeguro(cp: number): string {
  try {
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
  } catch {
    return '';
  }
}
