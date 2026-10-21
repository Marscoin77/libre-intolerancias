/**
 * Libre · Barrido en rejilla de TODA Catalunya
 * ----------------------------------------------------------------------------
 * Divide Catalunya en casillas geográficas y llama a analizar.mjs --bbox por
 * cada una, en secuencia (una sola consulta Overpass a la vez). La caché
 * procesados.json evita repetir restaurantes ya analizados en runs anteriores.
 *
 * Uso: LIBRE_ADMIN_TOKEN=... node barrido-catalunya.mjs [paso] [conc]
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PASO = parseFloat(process.argv[2] || '0.25');
const CONC = process.argv[3] || '10';
const ANALIZADOR = fileURLToPath(new URL('./analizar.mjs', import.meta.url));

// Caja envolvente de Catalunya (con un pequeño margen)
const S = 40.45, N = 42.90, W = 0.10, E = 3.35;

const casillas = [];
for (let s = S; s < N; s += PASO) {
  for (let w = W; w < E; w += PASO) {
    const n = Math.min(s + PASO, N);
    const e = Math.min(w + PASO, E);
    casillas.push({ s: +s.toFixed(3), w: +w.toFixed(3), n: +n.toFixed(3), e: +e.toFixed(3) });
  }
}

console.log(`\n🗺️  Barrido de Catalunya · ${casillas.length} casillas de ${PASO}° · conc ${CONC}\n`);

let idx = 0;
for (const c of casillas) {
  idx++;
  const bbox = `${c.s},${c.w},${c.n},${c.e}`;
  process.stdout.write(`\n[${idx}/${casillas.length}] casilla ${bbox}\n`);
  try {
    execFileSync('node', [ANALIZADOR, 'Catalunya', '3000', '--conc', String(CONC), '--bbox', bbox], {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (e) {
    console.log(`   (casilla con error, sigo): ${e.message}`);
  }
}
console.log(`\n✅ Barrido de Catalunya terminado · ${casillas.length} casillas.\n`);
