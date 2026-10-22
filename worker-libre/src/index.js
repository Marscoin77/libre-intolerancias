/**
 * Worker "libre-api" — API de Libre sobre Cloudflare D1.
 *
 * Dos partes:
 *  1) CATÁLOGO DE PRODUCTOS (solo lectura): GET /productos  (sustituye a PostgREST de Supabase).
 *  2) MAPA COMUNITARIO DE RESTAURANTES (lectura + escritura): /restaurantes, /valoraciones,
 *     /perfil, /reportes  (sustituye a comunidad.ts sobre Supabase Auth/RLS).
 *
 * Identidad: la app no usa login con contraseña. Cada móvil genera un id de usuario anónimo
 * (UUID) y lo guarda en el dispositivo; lo envía en cada escritura para atribuir sus aportaciones
 * (igual propósito que el login anónimo de Supabase). La defensa real ante abuso es la moderación
 * (tabla reportes + estado 'oculto'), no el secreto del id.
 */

const TAM_PAGINA = 24;

const ID_A_ALERGENOS = {
  gluten: ['gluten'], lactosa: ['milk'], huevo: ['eggs'], pescado: ['fish'],
  marisco: ['crustaceans', 'molluscs'], frutos_secos: ['nuts'], soja: ['soybeans'],
  cacahuete: ['peanuts'], sesamo: ['sesame-seeds'], mostaza: ['mustard'], apio: ['celery'],
  sulfitos: ['sulphur-dioxide-and-sulphites'], altramuces: ['lupin'],
};
const OFICIALES = [
  'gluten', 'milk', 'eggs', 'fish', 'crustaceans', 'molluscs', 'nuts',
  'soybeans', 'peanuts', 'sesame-seeds', 'mustard', 'celery',
  'sulphur-dioxide-and-sulphites', 'lupin',
];
const BIT = Object.fromEntries(OFICIALES.map((t, i) => [t, 1 << i]));

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200, extra = {}) =>
  Response.json(data, { status, headers: { ...CORS, ...extra } });

const jarr = (s) => {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
};
const jobj = (s) => {
  if (!s) return null;
  try { const v = JSON.parse(s); return v && typeof v === 'object' ? v : null; } catch { return null; }
};

// ============================================================================
// CATÁLOGO DE PRODUCTOS
// ============================================================================

function mascaraDe(ids) {
  let m = 0;
  for (const id of ids) for (const tag of ID_A_ALERGENOS[id] || []) m |= BIT[tag] || 0;
  return m;
}

function ftsQuery(texto) {
  const tokens = String(texto)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2)
    .slice(0, 8)
    .map((t) => `"${t.replace(/"/g, '')}"*`);
  return tokens.join(' ');
}

const SELECT_PROD = `
  p.ean, p.nombre, p.marca, p.cantidad_texto, p.categorias, p.ingredientes,
  p.alergenos, p.trazas, p.nutriscore,
  p.foto_frontal_mini_url, p.foto_frontal_url, p.foto_ingredientes_url, p.foto_nutricion_url,
  p.energia_kcal_100g, p.grasas_100g, p.saturadas_100g, p.hidratos_100g,
  p.azucares_100g, p.fibra_100g, p.proteinas_100g, p.sal_100g,
  (select json_group_array(json_object('supermercado_id', ps.supermercado_id))
     from producto_supermercado ps where ps.ean = p.ean) as supers`;

function aFilaProd(r) {
  const n = (v) => (v == null ? null : Number(v));
  return {
    ean: r.ean, nombre: r.nombre, marca: r.marca, cantidad_texto: r.cantidad_texto,
    categorias: jarr(r.categorias), ingredientes: r.ingredientes,
    alergenos: jarr(r.alergenos), trazas: jarr(r.trazas), nutriscore: r.nutriscore,
    foto_frontal_mini_url: r.foto_frontal_mini_url, foto_frontal_url: r.foto_frontal_url,
    foto_ingredientes_url: r.foto_ingredientes_url, foto_nutricion_url: r.foto_nutricion_url,
    energia_kcal_100g: n(r.energia_kcal_100g), grasas_100g: n(r.grasas_100g),
    saturadas_100g: n(r.saturadas_100g), hidratos_100g: n(r.hidratos_100g),
    azucares_100g: n(r.azucares_100g), fibra_100g: n(r.fibra_100g),
    proteinas_100g: n(r.proteinas_100g), sal_100g: n(r.sal_100g),
    precio: null, precio_tipo: null, precio_fecha: null,
    producto_supermercado: jarr(r.supers),
  };
}

async function consultarProductos(env, q) {
  const pagina = Math.max(1, parseInt(q.get('pagina') || '1', 10) || 1);
  const orden = q.get('orden') || 'relevancia';
  const texto = (q.get('texto') || '').trim();
  const supermercadoId = (q.get('supermercadoId') || '').trim();
  const categoriaTag = (q.get('categoriaTag') || '').trim();
  const nutriscore = (q.get('nutriscore') || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const intolerancias = (q.get('intolerancias') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const excluirAlergenos = q.get('excluirAlergenos') !== '0';
  const excluirTrazas = q.get('excluirTrazas') === '1';
  const contar = q.get('contar') !== '0' && pagina === 1;

  const where = [];
  const args = [];
  let joinFts = '';
  let orderFts = false;

  if (texto) {
    const fq = ftsQuery(texto);
    if (fq) {
      joinFts = 'join productos_fts f on f.ean = p.ean';
      where.push('productos_fts match ?');
      args.push(fq);
      orderFts = true;
    }
  }
  if (supermercadoId) {
    where.push('exists (select 1 from producto_supermercado ps where ps.ean = p.ean and ps.supermercado_id = ?)');
    args.push(supermercadoId);
  }
  if (categoriaTag) { where.push('p.categorias like ?'); args.push(`%"${categoriaTag}"%`); }
  if (nutriscore.length) { where.push(`p.nutriscore in (${nutriscore.map(() => '?').join(',')})`); args.push(...nutriscore); }
  const mask = mascaraDe(intolerancias);
  if (excluirAlergenos && mask > 0) {
    where.push('p.tiene_ingredientes = 1');
    where.push('(p.alergenos_mask & ?) = 0');
    args.push(mask);
  }
  if (excluirTrazas && mask > 0) { where.push('(p.trazas_mask & ?) = 0'); args.push(mask); }

  const whereSql = where.length ? 'where ' + where.join(' and ') : '';
  let orderSql;
  if (orden === 'nombre') orderSql = 'order by p.nombre collate nocase asc';
  else if (orden === 'nutriscore') orderSql = 'order by (p.nutri_rank is null), p.nutri_rank asc';
  else if (orderFts) orderSql = 'order by bm25(productos_fts)';
  else orderSql = 'order by (p.nutri_rank is null), p.nutri_rank asc, p.completitud desc';

  const sql = `select ${SELECT_PROD} from productos p ${joinFts} ${whereSql} ${orderSql} limit ? offset ?`;
  const rows = await env.DB.prepare(sql).bind(...args, TAM_PAGINA, (pagina - 1) * TAM_PAGINA).all();
  const productos = (rows.results || []).map(aFilaProd);

  let total = productos.length;
  if (contar) {
    const cr = await env.DB.prepare(`select count(*) as n from productos p ${joinFts} ${whereSql}`).bind(...args).first();
    total = cr ? Number(cr.n) : productos.length;
  }
  return { productos, total };
}

// ============================================================================
// MAPA COMUNITARIO DE RESTAURANTES
// ============================================================================

const esUUID = (s) => typeof s === 'string' && /^[0-9a-f-]{10,40}$/i.test(s);
const recortar = (s, max) => (s == null ? null : String(s).slice(0, max));

const RESUMEN_COLS =
  'id, nombre, direccion, ciudad, lat, lon, tipo_cocina, telefono, sitio_web, creado_por, creado_en, fuente, analisis, analisis_fecha, media_estrellas, num_valoraciones';

const aResumen = (r) => ({
  id: r.id, nombre: r.nombre, direccion: r.direccion, ciudad: r.ciudad,
  lat: Number(r.lat), lon: Number(r.lon), tipo_cocina: r.tipo_cocina,
  telefono: r.telefono, sitio_web: r.sitio_web, creado_por: r.creado_por,
  creado_en: r.creado_en, fuente: r.fuente || 'comunidad',
  analisis: jobj(r.analisis), analisis_fecha: r.analisis_fecha,
  media_estrellas: Number(r.media_estrellas), num_valoraciones: Number(r.num_valoraciones),
});

/** Alta/actualización de un restaurante analizado desde OSM (uso del rastreador, no de la app). */
async function importarOsm(env, request) {
  if (!env.ADMIN_TOKEN || request.headers.get('x-admin-token') !== env.ADMIN_TOKEN)
    return json({ error: 'no autorizado' }, 401);
  const b = await request.json().catch(() => ({}));
  if (!b.osm_id) return json({ error: 'falta osm_id' }, 400);
  const lat = Number(b.lat), lon = Number(b.lon);
  const nombre = (b.nombre || '').trim();
  if (nombre.length < 2 || !(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180))
    return json({ error: 'datos inválidos' }, 400);
  const ahora = new Date().toISOString();
  await env.DB.prepare(
    `insert into restaurantes (id, nombre, direccion, ciudad, lat, lon, tipo_cocina, telefono, sitio_web, estado, creado_por, creado_en, osm_id, fuente, analisis, analisis_fecha)
     values (?,?,?,?,?,?,?,?,?, 'activo', 'osm', ?, ?, 'osm', ?, ?)
     on conflict(osm_id) do update set
       nombre=excluded.nombre, direccion=excluded.direccion, ciudad=excluded.ciudad,
       lat=excluded.lat, lon=excluded.lon, tipo_cocina=excluded.tipo_cocina,
       telefono=excluded.telefono, sitio_web=excluded.sitio_web,
       analisis=excluded.analisis, analisis_fecha=excluded.analisis_fecha`
  ).bind(
    crypto.randomUUID(), nombre, recortar(b.direccion, 160), recortar(b.ciudad, 80), lat, lon,
    recortar(b.tipo_cocina, 40), recortar(b.telefono, 30), recortar(b.sitio_web, 200),
    ahora, String(b.osm_id), b.analisis ? JSON.stringify(b.analisis) : null, ahora
  ).run();
  return json({ ok: true });
}

// Lista (paginada por cursor osm_id) los restaurantes que tienen web pero aún
// no tienen análisis, para reanalizarlos con más palabras clave.
async function listarPendientesWeb(env, request, q) {
  if (!env.ADMIN_TOKEN || request.headers.get('x-admin-token') !== env.ADMIN_TOKEN)
    return json({ error: 'no autorizado' }, 401);
  const limite = Math.min(parseInt(q.get('limit') || '500', 10) || 500, 1000);
  const desde = q.get('desde') || '';
  const rows = await env.DB.prepare(
    `select osm_id, nombre, lat, lon, sitio_web, ciudad, tipo_cocina, telefono from restaurantes
     where analisis is null and sitio_web is not null and sitio_web <> '' and osm_id > ?
     order by osm_id limit ?`
  ).bind(desde, limite).all();
  return json(rows.results || []);
}

// Valoración y reseñas EN VIVO desde Google Places API (New). Por licencia de
// Google solo se puede mostrar en el momento: NO se guardan rating ni reseñas.
// Lo único que cacheamos es el place_id (eso sí lo permite su política).
async function googlePlaces(env, q) {
  const id = q.get('id');
  if (!id) return json({ error: 'falta id' }, 400);
  if (!env.GOOGLE_API_KEY) return json({ disponible: false, motivo: 'sin-clave' });
  const r = await env.DB.prepare('select id, nombre, lat, lon, ciudad, place_id from restaurantes where id = ?').bind(id).first();
  if (!r) return json({ disponible: false, motivo: 'no-existe' });
  const KEY = env.GOOGLE_API_KEY;
  try {
    let placeId = r.place_id;
    if (!placeId) {
      const bu = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.id,places.location' },
        body: JSON.stringify({
          textQuery: r.nombre + (r.ciudad ? ' ' + r.ciudad : ''),
          locationBias: { circle: { center: { latitude: Number(r.lat), longitude: Number(r.lon) }, radius: 400 } },
          maxResultCount: 1, languageCode: 'es', regionCode: 'ES',
        }),
      });
      const bj = await bu.json();
      placeId = bj?.places?.[0]?.id || null;
      if (placeId) await env.DB.prepare('update restaurantes set place_id = ? where id = ?').bind(placeId, id).run();
    }
    if (!placeId) return json({ disponible: false, motivo: 'no-encontrado' });
    const du = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`, {
      headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,priceLevel,googleMapsUri,websiteUri,editorialSummary,reviews' },
    });
    const d = await du.json();
    if (d.error) return json({ disponible: false, motivo: 'detalle', detalle: d.error.message || '' });
    const resenas = (d.reviews || []).slice(0, 4).map((rv) => ({
      autor: rv.authorAttribution?.displayName || null,
      nota: rv.rating ?? null,
      texto: (rv.text?.text || rv.originalText?.text || '').slice(0, 600),
      cuando: rv.relativePublishingTimeDescription || null,
    }));
    return json({
      disponible: true, place_id: placeId,
      rating: d.rating ?? null, total: d.userRatingCount ?? null,
      precio: d.priceLevel || null, maps_uri: d.googleMapsUri || null,
      web: d.websiteUri || null, resumen: d.editorialSummary?.text || null,
      resenas,
    });
  } catch (e) {
    return json({ disponible: false, motivo: 'error', detalle: String((e && e.message) || e) });
  }
}

const aValoracion = (r) => ({
  id: r.id, restaurante_id: r.restaurante_id, usuario_id: r.usuario_id,
  estrellas: Number(r.estrellas), intolerancias_ok: jarr(r.intolerancias_ok),
  comentario: r.comentario, creado_en: r.creado_en, actualizado_en: r.actualizado_en,
  apodo: r.apodo ?? undefined,
});

async function listarRestaurantes(env, q) {
  const norte = parseFloat(q.get('norte')), sur = parseFloat(q.get('sur'));
  const este = parseFloat(q.get('este')), oeste = parseFloat(q.get('oeste'));
  if ([norte, sur, este, oeste].some((n) => Number.isNaN(n))) return json({ error: 'bounds inválidos' }, 400);
  const rows = await env.DB.prepare(
    `select ${RESUMEN_COLS} from restaurantes_resumen
     where lat >= ? and lat <= ? and lon >= ? and lon <= ? limit 300`
  ).bind(sur, norte, oeste, este).all();
  return json((rows.results || []).map(aResumen));
}

async function obtenerRestaurante(env, id) {
  const r = await env.DB.prepare(`select ${RESUMEN_COLS} from restaurantes_resumen where id = ?`).bind(id).first();
  return json(r ? aResumen(r) : null);
}

async function crearRestaurante(env, b) {
  const nombre = (b.nombre || '').trim();
  if (nombre.length < 2 || nombre.length > 80) return json({ error: 'El nombre debe tener entre 2 y 80 caracteres.' }, 400);
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) return json({ error: 'Coordenadas inválidas.' }, 400);
  if (!esUUID(b.usuarioId)) return json({ error: 'usuario no válido' }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `insert into restaurantes (id, nombre, direccion, ciudad, lat, lon, tipo_cocina, telefono, sitio_web, estado, creado_por, creado_en)
     values (?,?,?,?,?,?,?,?,?, 'activo', ?, ?)`
  ).bind(
    id, nombre, recortar(b.direccion, 160), recortar(b.ciudad, 80), lat, lon,
    recortar(b.tipo_cocina, 40), recortar(b.telefono, 30), recortar(b.sitio_web, 200),
    b.usuarioId, new Date().toISOString()
  ).run();
  return json({ id });
}

async function listarValoraciones(env, restauranteId) {
  const rows = await env.DB.prepare(
    `select v.*, p.apodo from valoraciones v
     left join perfiles_publicos p on p.usuario_id = v.usuario_id
     where v.restaurante_id = ? order by v.actualizado_en desc limit 100`
  ).bind(restauranteId).all();
  return json((rows.results || []).map(aValoracion));
}

async function miValoracion(env, q) {
  const restauranteId = q.get('restauranteId'), usuarioId = q.get('usuarioId');
  if (!restauranteId || !usuarioId) return json(null);
  const r = await env.DB.prepare(
    'select * from valoraciones where restaurante_id = ? and usuario_id = ?'
  ).bind(restauranteId, usuarioId).first();
  return json(r ? aValoracion(r) : null);
}

async function guardarValoracion(env, b) {
  const estrellas = Number(b.estrellas);
  if (!esUUID(b.restauranteId) || !esUUID(b.usuarioId)) return json({ error: 'datos no válidos' }, 400);
  if (!(estrellas >= 1 && estrellas <= 5)) return json({ error: 'estrellas 1-5' }, 400);
  const ahora = new Date().toISOString();
  const okJson = JSON.stringify(Array.isArray(b.intoleranciasOk) ? b.intoleranciasOk : []);
  await env.DB.prepare(
    `insert into valoraciones (id, restaurante_id, usuario_id, estrellas, intolerancias_ok, creado_en, actualizado_en)
     values (?,?,?,?,?,?,?)
     on conflict(restaurante_id, usuario_id) do update set
       estrellas = excluded.estrellas,
       intolerancias_ok = excluded.intolerancias_ok,
       actualizado_en = excluded.actualizado_en`
  ).bind(crypto.randomUUID(), b.restauranteId, b.usuarioId, estrellas, okJson, ahora, ahora).run();
  return json({ ok: true });
}

async function obtenerPerfil(env, q) {
  const usuarioId = q.get('usuarioId');
  if (!usuarioId) return json({ apodo: null });
  const r = await env.DB.prepare('select apodo from perfiles_publicos where usuario_id = ?').bind(usuarioId).first();
  return json({ apodo: r?.apodo ?? null });
}

async function guardarPerfil(env, b) {
  const apodo = (b.apodo || '').trim();
  if (!esUUID(b.usuarioId)) return json({ error: 'usuario no válido' }, 400);
  if (apodo.length < 2 || apodo.length > 24) return json({ error: 'El apodo debe tener entre 2 y 24 caracteres.' }, 400);
  await env.DB.prepare(
    `insert into perfiles_publicos (usuario_id, apodo, creado_en) values (?,?,?)
     on conflict(usuario_id) do update set apodo = excluded.apodo`
  ).bind(b.usuarioId, apodo, new Date().toISOString()).run();
  return json({ ok: true });
}

async function crearReporte(env, b) {
  if (!['restaurante', 'valoracion'].includes(b.objetoTipo)) return json({ error: 'tipo no válido' }, 400);
  if (!esUUID(b.usuarioId)) return json({ error: 'usuario no válido' }, 400);
  await env.DB.prepare(
    'insert into reportes (id, objeto_tipo, objeto_id, usuario_id, motivo, creado_en) values (?,?,?,?,?,?)'
  ).bind(crypto.randomUUID(), b.objetoTipo, String(b.objetoId), b.usuarioId, recortar(b.motivo, 300), new Date().toISOString()).run();
  return json({ ok: true });
}

// ============================================================================

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const m = request.method;
    const q = url.searchParams;
    const body = async () => request.json().catch(() => ({}));

    try {
      if (path === '/' || path === '/health') return json({ ok: true, servicio: 'libre-api' });

      if (path === '/productos' && m === 'GET') return json(await consultarProductos(env, q));

      if (path === '/restaurantes' && m === 'GET') return listarRestaurantes(env, q);
      if (path === '/restaurantes' && m === 'POST') return crearRestaurante(env, await body());
      if (path.startsWith('/restaurantes/') && m === 'GET')
        return obtenerRestaurante(env, decodeURIComponent(path.slice('/restaurantes/'.length)));

      if (path === '/valoraciones' && m === 'GET') {
        const r = q.get('restauranteId');
        return r ? listarValoraciones(env, r) : json([]);
      }
      if (path === '/valoraciones' && m === 'POST') return guardarValoracion(env, await body());
      if (path === '/valoraciones/mia' && m === 'GET') return miValoracion(env, q);

      if (path === '/perfil' && m === 'GET') return obtenerPerfil(env, q);
      if (path === '/perfil' && m === 'POST') return guardarPerfil(env, await body());

      if (path === '/reportes' && m === 'POST') return crearReporte(env, await body());

      if (path === '/admin/restaurantes' && m === 'POST') return importarOsm(env, request);
      if (path === '/admin/pendientes-web' && m === 'GET') return listarPendientesWeb(env, request, q);
      if (path === '/google' && m === 'GET') return googlePlaces(env, q);

      return json({ error: 'no encontrado' }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};
