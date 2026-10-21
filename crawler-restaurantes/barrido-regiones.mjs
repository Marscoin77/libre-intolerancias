/**
 * Libre · Barrido en rejilla de varias regiones de España
 * ----------------------------------------------------------------------------
 * Igual que barrido-catalunya.mjs pero recorre una lista de regiones (cada una
 * con su caja envolvente), casilla por casilla, llamando a analizar.mjs --bbox.
 * La caché procesados.json evita repetir restaurantes de runs anteriores.
 *
 * Uso: LIBRE_ADMIN_TOKEN=... node barrido-regiones.mjs [paso] [conc]
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PASO = parseFloat(process.argv[2] || '0.25');
const CONC = process.argv[3] || '10';
const ANALIZADOR = fileURLToPath(new URL('./analizar.mjs', import.meta.url));

// Cajas envolventes (s, w, n, e) de las regiones con más restaurantes / usuarios.
const REGIONES = [
  { label: 'Comunitat Valenciana', s: 37.80, w: -1.55, n: 40.80, e: 0.65 },
  { label: 'Illes Balears',        s: 38.60, w: 1.10,  n: 40.15, e: 4.40 },
  { label: 'Comunidad de Madrid',  s: 39.85, w: -4.60, n: 41.20, e: -3.00 },
  { label: 'Aragó',                s: 39.80, w: -2.20, n: 42.95, e: 0.85 },
];

function tiles(r) {
  const out = [];
  for (let s = r.s; s < r.n; s += PASO) {
    for (let w = r.w; w < r.e; w += PASO) {
      out.push({
        s: +s.toFixed(3), w: +w.toFixed(3),
        n: +Math.min(s + PASO, r.n).toFixed(3),
        e: +Math.min(w + PASO, r.e).toFixed(3),
      });
    }
  }
  return out;
}

for (const r of REGIONES) {
  const cas = tiles(r);
  console.log(`\n========================================`);
  console.log(`🗺️  ${r.label} · ${cas.length} casillas de ${PASO}° · conc ${CONC}`);
  console.log(`========================================\n`);
  let i = 0;
  for (const c of cas) {
    i++;
    const bbox = `${c.s},${c.w},${c.n},${c.e}`;
    process.stdout.write(`\n[${r.label} ${i}/${cas.length}] ${bbox}\n`);
    try {
      execFileSync('node', [ANALIZADOR, r.label, '3000', '--conc', String(CONC), '--bbox', bbox], {
        stdio: 'inherit',
        env: process.env,
      });
    } catch (e) {
      console.log(`   (casilla con error, sigo): ${e.message}`);
    }
  }
}
console.log(`\n✅ Barrido de regiones terminado.\n`);
