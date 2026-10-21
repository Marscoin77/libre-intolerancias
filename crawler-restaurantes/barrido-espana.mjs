/**
 * Libre · Barrido en rejilla de TODA ESPAÑA
 * ----------------------------------------------------------------------------
 * Cubre península + Balears + Ceuta/Melilla (una caja) y Canarias (otra caja),
 * casilla por casilla, llamando a analizar.mjs --bbox. Secuencial: una sola
 * consulta Overpass a la vez. La caché procesados.json no repite nada ya hecho
 * (Catalunya, Madrid, etc. se saltan solos).
 *
 * Para front-cargar valor, dentro de cada caja las casillas se ordenan por
 * cercanía al centro de población (más denso primero), por si la sesión se
 * corta antes de acabar.
 *
 * Uso: LIBRE_ADMIN_TOKEN=... node barrido-espana.mjs [paso] [conc] [max]
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PASO = parseFloat(process.argv[2] || '0.35');
const CONC = process.argv[3] || '10';
const MAX = process.argv[4] || '6000';
const ANALIZADOR = fileURLToPath(new URL('./analizar.mjs', import.meta.url));

// Cajas envolventes (s, w, n, e). La primera incluye península, Balears y
// Ceuta/Melilla (bajando hasta lat 35). La segunda, Canarias.
const CAJAS = [
  { label: 'España', s: 35.00, w: -9.40, n: 43.90, e: 4.45,
    // puntos densos para ordenar casillas (lon, lat aprox de grandes urbes)
    focos: [[-3.70, 40.42], [2.17, 41.39], [-0.38, 39.47], [-5.98, 37.39],
            [-0.88, 41.65], [-4.42, 36.72], [-2.93, 43.26], [-8.41, 43.36],
            [-5.84, 43.36], [-1.13, 37.99], [2.65, 39.57]] },
  { label: 'Canarias', s: 27.55, w: -18.25, n: 29.50, e: -13.30,
    focos: [[-15.43, 28.12], [-16.25, 28.47]] },
];

function tiles(r) {
  const out = [];
  for (let s = r.s; s < r.n; s += PASO) {
    for (let w = r.w; w < r.e; w += PASO) {
      const cy = s + PASO / 2, cx = w + PASO / 2;
      // distancia al foco más cercano (para ordenar denso-primero)
      let d = Infinity;
      for (const [fx, fy] of r.focos) {
        const dd = (cx - fx) ** 2 + (cy - fy) ** 2;
        if (dd < d) d = dd;
      }
      out.push({
        s: +s.toFixed(3), w: +w.toFixed(3),
        n: +Math.min(s + PASO, r.n).toFixed(3),
        e: +Math.min(w + PASO, r.e).toFixed(3),
        d,
      });
    }
  }
  out.sort((a, b) => a.d - b.d); // más cerca de una urbe = antes
  return out;
}

let totalCas = 0;
const planes = CAJAS.map((r) => ({ r, cas: tiles(r) }));
for (const p of planes) totalCas += p.cas.length;
console.log(`\n🇪🇸  Barrido de TODA ESPAÑA · ${totalCas} casillas de ${PASO}° · conc ${CONC} · máx ${MAX}/casilla\n`);

let global = 0;
for (const { r, cas } of planes) {
  console.log(`\n==== ${r.label} · ${cas.length} casillas ====\n`);
  let i = 0;
  for (const c of cas) {
    i++; global++;
    const bbox = `${c.s},${c.w},${c.n},${c.e}`;
    process.stdout.write(`\n[${global}/${totalCas} · ${r.label} ${i}/${cas.length}] ${bbox}\n`);
    const argsAnal = [ANALIZADOR, r.label, String(MAX), '--conc', String(CONC), '--bbox', bbox];
    if (process.env.TODOS) argsAnal.push('--todos');
    try {
      execFileSync('node', argsAnal, {
        stdio: 'inherit', env: process.env,
      });
    } catch (e) {
      console.log(`   (casilla con error, sigo): ${e.message}`);
    }
  }
}
console.log(`\n✅ Barrido de toda España terminado · ${totalCas} casillas.\n`);
