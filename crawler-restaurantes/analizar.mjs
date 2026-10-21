/**
 * Libre · Analizador de restaurantes (v2)
 * ----------------------------------------------------------------------------
 * Para una ciudad/zona:
 *   1) Saca de OpenStreetMap los restaurantes que tengan WEB o etiquetas de dieta
 *      (diet:gluten_free, diet:vegan, diet:vegetarian, diet:lactose_free).
 *   2) Clasifica combinando DOS fuentes:
 *        · Etiquetas OSM diet:* (dato estructurado y fiable → la base).
 *        · Texto de su web pública (ES + CA + EN).
 *   3) Clasifica cada intolerancia como:
 *        'apto'   (verde)  'dudoso' (ámbar)  'no' (rojo)   — o nada (gris / sin datos).
 *   4) Guarda el resultado en el mapa de Libre (D1, vía el Worker).
 *
 * SEGURIDAD: nunca "apto" sin señal explícita; NUNCA "no apto" por falta de datos.
 * Siempre se guarda fuente (web u OSM) y fecha; la app dice "confírmalo en el sitio".
 *
 * Uso:
 *   node analizar.mjs "Girona" 40
 *   node analizar.mjs "Barcelona" 300 --conc 8
 *   node analizar.mjs "Madrid" 300 --refrescar      (reanaliza aunque ya estén)
 * Env: LIBRE_API, LIBRE_ADMIN_TOKEN
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const API = process.env.LIBRE_API || 'https://libre-api.adriagimenez238.workers.dev';
const TOKEN = process.env.LIBRE_ADMIN_TOKEN || '';
const UA = 'LibreApp-Analizador/1.1 (+contacto: adriagimenez238@gmail.com)';

const args = process.argv.slice(2);
const ciudad = args[0];
const MAX = parseInt(args.find((a, i) => i > 0 && /^\d+$/.test(a)) || '40', 10);
const CONC = parseInt((args[args.indexOf('--conc') + 1] || '6'), 10) || 6;
const REFRESCAR = args.includes('--refrescar');
// Modo rejilla: --bbox "s,w,n,e" salta Nominatim y usa esa caja directamente.
const BBOX = args.includes('--bbox') ? (args[args.indexOf('--bbox') + 1] || '') : null;
// Modo "todos": trae TODOS los locales (aunque no tengan web) y los guarda aunque
// no haya señal (como punto "sin datos, confírmalo en el sitio").
const TODOS = args.includes('--todos');
const CACHE = new URL('./procesados.json', import.meta.url);

if (!ciudad) { console.error('Uso: node analizar.mjs "<ciudad>" [máx] [--conc N] [--refrescar]'); process.exit(1); }

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[·•]/g, '').toLowerCase();

async function traer(url, opciones = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(url, { ...opciones, signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opciones.headers || {}) } }); }
  finally { clearTimeout(t); }
}

// --- 1) Señales de etiquetas OSM diet:* (lo más fiable) ------------------------
const DIET_TAG = {
  'diet:gluten_free': 'gluten', 'diet:lactose_free': 'lactosa',
  'diet:vegan': 'vegano', 'diet:vegetarian': 'vegetariano', 'diet:egg_free': 'huevo',
};
function analizarTags(tags) {
  const flags = {}, evid = [];
  for (const [tag, id] of Object.entries(DIET_TAG)) {
    const v = tags[tag];
    if (!v) continue;
    const estado = v === 'only' || v === 'yes' ? 'apto' : v === 'limited' ? 'dudoso' : v === 'no' ? 'no' : null;
    if (estado) { flags[id] = estado; evid.push(`OSM ${tag}=${v}`); }
  }
  return { flags, evid };
}

// --- 2) Señales del texto de la web (ES + CA + EN) -----------------------------
const POSITIVO = {
  gluten: ['sin gluten', 'sense gluten', 'gluten free', 'libre de gluten', 'celiac', 'celiaco', 'per a celiac', 'apto celiac', 'menu sense gluten', 'opciones sin gluten', 'opcions sense gluten'],
  lactosa: ['sin lactosa', 'sense lactosa', 'lactose free', 'libre de lactosa'],
  huevo: ['sin huevo', 'sense ou', 'egg free'],
  frutos_secos: ['sin frutos secos', 'sense fruits secs'],
  soja: ['sin soja', 'sense soja'],
};
const DIETA_POS = {
  vegano: ['vegano', 'vegana', 'vega ', 'vegan', '100% vegetal', 'opciones veganas', 'opcions veganes', 'plant based', 'plant-based'],
  vegetariano: ['vegetariano', 'vegetariana', 'vegetaria', 'vegetarian'],
};
const NEGATIVO = {
  gluten: ['no apto para celiac', 'no disponemos de opciones sin gluten', 'no tenim opcions sense gluten', 'no apto celiac'],
};
const CONCIENCIA = ['alergen', 'allergen', 'alergeno', 'intoleran', 'carta de alergenos', 'carta d alergens', 'informacio alergens', 'declaracion de alergenos'];

function analizarTexto(texto) {
  const t = norm(texto);
  const flags = {}, evid = [];
  const marca = (id, estado, frase) => {
    if (flags[id] === 'apto') return;
    if (estado === 'dudoso' && flags[id]) return;
    flags[id] = estado;
    if (frase && !evid.includes(frase)) evid.push(frase);
  };
  for (const [id, fs] of Object.entries(POSITIVO)) for (const f of fs) if (t.includes(f)) marca(id, 'apto', f);
  for (const [id, fs] of Object.entries(DIETA_POS)) for (const f of fs) if (t.includes(f)) marca(id, 'apto', f);
  for (const [id, fs] of Object.entries(NEGATIVO)) for (const f of fs) if (t.includes(f)) marca(id, 'no', f);
  const conciencia = CONCIENCIA.some((f) => t.includes(f));
  if (conciencia) for (const id of ['gluten', 'lactosa']) if (!flags[id]) marca(id, 'dudoso', 'menciona alergenos');
  return { flags, evid, conciencia };
}

const aTexto = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').slice(0, 60000);

function enlacesInteresantes(html, base) {
  const out = [];
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null && out.length < 3) {
    if (/(carta|menu|menú|alergen|al·lergen|alérgen|intoleran|celiac|dieta)/i.test(m[1])) {
      try { const u = new URL(m[1], base); if (u.hostname === new URL(base).hostname && !out.includes(u.href)) out.push(u.href); }
      catch { /* href inválido */ }
    }
  }
  return out;
}

async function analizarWeb(sitio) {
  let url = sitio.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const res = await traer(url);
  if (!res.ok) return null;
  const html = await res.text();
  let texto = aTexto(html);
  for (const extra of enlacesInteresantes(html, url)) {
    try { const r2 = await traer(extra); if (r2.ok) texto += ' ' + aTexto(await r2.text()); } catch { /* ignore */ }
  }
  return { ...analizarTexto(texto), url };
}

// --- Combinar: las etiquetas OSM mandan; la web completa lo que falte ----------
function combinar(tagRes, webRes, url) {
  const flags = { ...(webRes?.flags || {}), ...tagRes.flags };
  const evid = [...tagRes.evid, ...(webRes?.evid || [])].slice(0, 8);
  const conciencia = Boolean(webRes?.conciencia);
  if (Object.keys(flags).length === 0 && !conciencia) return null;
  return { url: url || null, flags, conciencia, evidencias: evid };
}

// --- OSM / Nominatim -----------------------------------------------------------
async function bboxCiudad(nombre) {
  const r = await traer(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(nombre)}`);
  const j = await r.json();
  if (!j[0]?.boundingbox) throw new Error(`No se encontró "${nombre}" en España.`);
  const [s, n, w, e] = j[0].boundingbox.map(Number);
  return { s, n, w, e, nombre: j[0].display_name };
}

async function restaurantesOSM(b, limite) {
  const am = TODOS
    ? 'amenity~"^(restaurant|cafe|fast_food|bar|pub|food_court|ice_cream|biergarten)$"'
    : 'amenity~"^(restaurant|cafe|fast_food|bar)$"';
  const bbox = `${b.s},${b.w},${b.n},${b.e}`;
  // En modo --todos: todos los locales de comida. Si no: solo los que traen web o dieta.
  const cuerpo = TODOS
    ? `nwr[${am}](${bbox});`
    : `nwr[${am}]["website"](${bbox});
    nwr[${am}]["contact:website"](${bbox});
    nwr[${am}]["diet:gluten_free"](${bbox});
    nwr[${am}]["diet:vegan"](${bbox});
    nwr[${am}]["diet:vegetarian"](${bbox});
    nwr[${am}]["diet:lactose_free"](${bbox});`;
  const q = `[out:json][timeout:120];(${cuerpo});out center tags ${limite * 4};`;
  for (const ep of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      const r = await traer(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q) }, 90000);
      if (!r.ok) continue;
      const j = await r.json();
      const vistos = new Set();
      const out = [];
      for (const el of j.elements || []) {
        const osm_id = `${el.type}/${el.id}`;
        if (vistos.has(osm_id)) continue;
        vistos.add(osm_id);
        const tg = el.tags || {};
        const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
        if (!tg.name || lat == null) continue;
        out.push({
          osm_id, nombre: tg.name, lat, lon,
          web: tg.website || tg['contact:website'] || null,
          tipo_cocina: tg.cuisine?.replace(/[_;]/g, ' ') || null,
          telefono: tg.phone || tg['contact:phone'] || null,
          tags: tg,
        });
      }
      return out;
    } catch { /* siguiente mirror */ }
  }
  throw new Error('Overpass no respondió.');
}

async function guardar(r, analisis) {
  if (!TOKEN) return 'sin-token';
  const res = await traer(`${API}/admin/restaurantes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': TOKEN },
    body: JSON.stringify({ osm_id: r.osm_id, nombre: r.nombre, lat: r.lat, lon: r.lon, ciudad, tipo_cocina: r.tipo_cocina, telefono: r.telefono, sitio_web: r.web, analisis }),
  });
  return res.ok ? 'ok' : `error ${res.status}`;
}

function cargarCache() { try { return new Set(JSON.parse(readFileSync(CACHE, 'utf8'))); } catch { return new Set(); } }
function guardarCache(set) { try { writeFileSync(CACHE, JSON.stringify([...set])); } catch { /* ignore */ } }

// --- Pool de concurrencia ------------------------------------------------------
async function pool(items, n, worker) {
  let i = 0;
  const run = async () => { while (i < items.length) { const idx = i++; await worker(items[idx], idx); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

// --- Principal -----------------------------------------------------------------
(async () => {
  const t0 = Date.now();
  console.log(`\n🔎 "${ciudad}" · máx ${MAX} · ${CONC} en paralelo${REFRESCAR ? ' · refrescar' : ''}${BBOX ? ' · bbox' : ''}\n`);
  let b;
  if (BBOX) {
    const [s, w, n, e] = BBOX.split(',').map(Number);
    if ([s, w, n, e].some((x) => Number.isNaN(x))) throw new Error('--bbox debe ser "s,w,n,e" numérico.');
    b = { s, w, n, e, nombre: `${ciudad} (bbox ${BBOX})` };
  } else {
    b = await bboxCiudad(ciudad);
    await dormir(600);
  }
  console.log(`   Zona: ${b.nombre}`);
  let lista = await restaurantesOSM(b, MAX);
  const procesados = REFRESCAR ? new Set() : cargarCache();
  const conDietTag = lista.filter((r) => Object.keys(r.tags).some((k) => k.startsWith('diet:'))).length;
  lista = lista.filter((r) => !procesados.has(r.osm_id)).slice(0, MAX);
  console.log(`   ${lista.length} a analizar (de OSM con web o etiquetas de dieta; ${conDietTag} traen diet:*)\n`);

  let conSenal = 0, guardados = 0, webFallo = 0;
  const resultados = [];
  await pool(lista, CONC, async (r) => {
    const tagRes = analizarTags(r.tags);
    let webRes = null;
    if (r.web) { try { webRes = await analizarWeb(r.web); } catch { webFallo++; } }
    const analisis = combinar(tagRes, webRes, r.web);
    let resumen = 'sin datos';
    if (analisis) {
      conSenal++;
      resumen = Object.entries(analisis.flags).map(([k, v]) => `${k}:${v}`).join(', ') || (analisis.conciencia ? 'menciona alergenos' : 'sin datos');
      if ((await guardar(r, analisis)) === 'ok') guardados++;
    } else if (TODOS) {
      // Sin señal: en modo todos lo guardamos igual como punto "sin datos".
      if ((await guardar(r, null)) === 'ok') guardados++;
    }
    procesados.add(r.osm_id);
    resultados.push({ nombre: r.nombre, osm_id: r.osm_id, web: r.web, resumen });
    console.log(`   • ${r.nombre.slice(0, 32).padEnd(32)} ${resumen}`);
  });

  guardarCache(procesados);
  try { writeFileSync(new URL('./ultimo-resultado.json', import.meta.url), JSON.stringify(resultados, null, 2)); } catch { /* ignore */ }
  const seg = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n✅ ${lista.length} analizados en ${seg}s (${(seg / Math.max(1, lista.length)).toFixed(1)}s/restaurante) · ${conSenal} con señal · ${guardados} guardados · ${webFallo} webs sin responder.`);
  if (!TOKEN) console.log('   (Sin LIBRE_ADMIN_TOKEN no se guarda; solo se analiza.)');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
