/**
 * Libre · Reanalizador de restaurantes "sin datos" que SÍ tienen web
 * ----------------------------------------------------------------------------
 * Recorre los restaurantes guardados con sitio_web pero sin análisis (endpoint
 * /admin/pendientes-web), vuelve a leer su web con un diccionario de palabras
 * clave ampliado (ES + CA + EN) y, si encuentra señal, actualiza su veredicto.
 * NUNCA marca "no apto" por falta de datos; solo añade señales positivas/avisos.
 *
 * Uso: LIBRE_ADMIN_TOKEN=... node reanalizar.mjs [conc]
 */
const API = process.env.LIBRE_API || 'https://libre-api.adriagimenez238.workers.dev';
const TOKEN = process.env.LIBRE_ADMIN_TOKEN || '';
const UA = 'LibreApp-Analizador/1.2 (+contacto: adriagimenez238@gmail.com)';
const CONC = parseInt(process.argv[2] || '12', 10) || 12;

if (!TOKEN) { console.error('Falta LIBRE_ADMIN_TOKEN'); process.exit(1); }

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[·•]/g, '').toLowerCase();

async function traer(url, opciones = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(url, { ...opciones, signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opciones.headers || {}) } }); }
  finally { clearTimeout(t); }
}

// --- Diccionario ampliado (sin acentos: el texto se normaliza) ----------------
const POSITIVO = {
  gluten: ['sin gluten', 'sense gluten', 'gluten free', 'gluten-free', 'glutenfree', 'libre de gluten',
    'sin tacc', 'celiac', 'celiaco', 'celiacos', 'celiaquia', 'per a celiac', 'apto celiac', 'apto celiacos',
    'apto para celiac', 'apto para celiacos', 'menu sin gluten', 'menu sense gluten', 'opciones sin gluten',
    'opcions sense gluten', 'opcion sin gluten', 'pan sin gluten', 'cerveza sin gluten', 'elaboraciones sin gluten',
    'productos sin gluten', 'carta sin gluten', 'platos sin gluten', 'sense tacc'],
  lactosa: ['sin lactosa', 'sense lactosa', 'lactose free', 'lactose-free', 'lactosefree', 'libre de lactosa',
    'opciones sin lactosa', 'intolerantes a la lactosa', 'intolerancia a la lactosa'],
  huevo: ['sin huevo', 'sense ou', 'egg free', 'egg-free'],
  frutos_secos: ['sin frutos secos', 'sense fruits secs', 'nut free', 'nut-free'],
  soja: ['sin soja', 'sense soja', 'soy free'],
};
const DIETA_POS = {
  vegano: ['vegano', 'vegana', 'veganos', 'veganas', 'vegan', 'vegans', '100% vegetal', 'cien por cien vegetal',
    'opciones veganas', 'opcions veganes', 'opcion vegana', 'platos veganos', 'menu vegano', 'cocina vegana',
    'plant based', 'plant-based'],
  vegetariano: ['vegetariano', 'vegetariana', 'vegetarianos', 'vegetarianas', 'vegetaria', 'vegetarian', 'veggie',
    'opciones vegetarianas', 'opcion vegetariana', 'platos vegetarianos', 'menu vegetariano', 'cocina vegetariana',
    'ovolactovegetariano'],
};
const NEGATIVO = {
  gluten: ['no apto para celiac', 'no apto para celiacos', 'no disponemos de opciones sin gluten',
    'no tenim opcions sense gluten', 'no apto celiac', 'no aptos para celiacos'],
};
const CONCIENCIA = ['alergen', 'allergen', 'alergeno', 'alergenos', 'al lergen', 'intoleran', 'intolerancia',
  'intolerancies', 'carta de alergenos', 'carta d alergens', 'informacio alergens', 'informacion de alergenos',
  'informacion alergenos', 'declaracion de alergenos', 'lista de alergenos', 'alergias', 'al lergies'];

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
    if (/(carta|menu|menú|alergen|al·lergen|alérgen|intoleran|celiac|celíac|dieta|vegan|vegeta)/i.test(m[1])) {
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
  const r = analizarTexto(texto);
  if (Object.keys(r.flags).length === 0 && !r.conciencia) return null;
  return { url, flags: r.flags, conciencia: r.conciencia, evidencias: r.evid.slice(0, 8) };
}

async function guardar(r, analisis) {
  const res = await traer(`${API}/admin/restaurantes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': TOKEN },
    body: JSON.stringify({ osm_id: r.osm_id, nombre: r.nombre, lat: r.lat, lon: r.lon, ciudad: r.ciudad, tipo_cocina: r.tipo_cocina, telefono: r.telefono, sitio_web: r.sitio_web, analisis }),
  });
  return res.ok;
}

async function pool(items, n, worker) {
  let i = 0;
  const run = async () => { while (i < items.length) { const idx = i++; await worker(items[idx]); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

(async () => {
  const t0 = Date.now();
  let cursor = '', paginas = 0, vistos = 0, nuevos = 0;
  console.log(`\n♻️  Reanálisis de pendientes con web · conc ${CONC}\n`);
  for (;;) {
    const r = await traer(`${API}/admin/pendientes-web?limit=500&desde=${encodeURIComponent(cursor)}`,
      { headers: { 'x-admin-token': TOKEN } }, 20000);
    const lista = await r.json().catch(() => []);
    if (!Array.isArray(lista) || lista.length === 0) break;
    paginas++;
    await pool(lista, CONC, async (rest) => {
      vistos++;
      let analisis = null;
      try { analisis = await analizarWeb(rest.sitio_web); } catch { /* web caída */ }
      if (analisis) { if (await guardar(rest, analisis)) nuevos++; }
    });
    cursor = lista[lista.length - 1].osm_id;
    const seg = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`   página ${paginas} · vistos ${vistos} · reclasificados ${nuevos} · ${seg}s`);
  }
  console.log(`\n✅ Reanálisis terminado · ${vistos} revisados · ${nuevos} reclasificados en ${((Date.now() - t0) / 1000 / 60).toFixed(1)} min.`);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
