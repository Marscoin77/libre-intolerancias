import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WebView as WebViewType, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { CADENAS } from '../../src/data/cadenas';
import { PRODUCTOS } from '../../src/data/productos';
import { evaluarCompatibilidad } from '../../src/lib/compatibilidad';
import { usePerfil } from '../../src/lib/PerfilContext';
import { MAPA_HTML } from '../../src/lib/mapaHtml';
import {
  Bounds,
  MAX_SPAN_GRADOS,
  Tienda,
  cargarSupermercados,
  distanciaKm,
} from '../../src/lib/supermercados';
import { RestauranteResumen, cargarRestaurantes } from '../../src/lib/comunidad';
import Aparece from '../../src/components/Aparece';
import SoftPressable from '../../src/components/SoftPressable';
import Icono from '../../src/components/Icono';
import { colors, fuente, radius, sombra } from '../../src/theme';

// Carga tolerante: si la app instalada no incluye el módulo nativo (falta recompilar),
// la pestaña avisa en vez de tumbar toda la app con una pantalla en blanco.
let WebView: typeof WebViewType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

// Color de los marcadores de restaurantes (coral), para distinguirlos de los supermercados.
const COLOR_REST = '#E8615A';

// Etiquetas legibles para las banderas del análisis automático de la web.
const APTO_LABEL: Record<string, string> = {
  gluten: 'Sin gluten', lactosa: 'Sin lactosa', huevo: 'Sin huevo',
  frutos_secos: 'Sin frutos secos', soja: 'Sin soja', vegano: 'Vegano', vegetariano: 'Vegetariano',
};
const colorApto = (e: string) =>
  e === 'apto'
    ? { bg: colors.aptoBg, fg: colors.apto }
    : e === 'no'
      ? { bg: colors.noAptoBg, fg: colors.noApto }
      : { bg: colors.precaucionBg, fg: colors.precaucion };

export default function TiendasScreen() {
  const { perfil } = usePerfil();
  const web = useRef<WebViewType>(null);
  const listo = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const ultimoBounds = useRef<(Bounds & { zoom: number }) | null>(null);

  const [modo, setModo] = useState<'supermercados' | 'restaurantes'>('supermercados');
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [restaurantes, setRestaurantes] = useState<RestauranteResumen[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lejos, setLejos] = useState(true);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<Tienda | null>(null);
  const [restSel, setRestSel] = useState<RestauranteResumen | null>(null);
  const [usuario, setUsuario] = useState<{ lat: number; lon: number } | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(
    () => (filtro ? tiendas.filter((t) => t.cadena.id === filtro) : tiendas),
    [tiendas, filtro]
  );

  const run = (js: string) => web.current?.injectJavaScript(`${js};true;`);

  // Marcadores del modo activo. Los restaurantes van en color coral para distinguirlos.
  const marcadores = useMemo(
    () =>
      modo === 'supermercados'
        ? visibles.map((t) => [t.id, t.lat, t.lon, t.cadena.color, t.nombre])
        : restaurantes.map((r) => [r.id, r.lat, r.lon, COLOR_REST, r.nombre]),
    [modo, visibles, restaurantes]
  );

  // Enviar marcadores al mapa cuando cambian
  useEffect(() => {
    if (!listo.current) return;
    run(`setTiendas(${JSON.stringify(marcadores)})`);
  }, [marcadores]);

  useEffect(() => {
    if (!listo.current) return;
    const id = modo === 'supermercados' ? seleccion?.id : restSel?.id;
    run(`resaltar(${JSON.stringify(id ?? null)})`);
  }, [seleccion, restSel, modo]);

  const centrarEnUsuario = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lon } = pos.coords;
      setUsuario({ lat, lon });
      run(`setUsuario(${lat},${lon});irA(${lat},${lon},14)`);
    } catch {
      setError('No se pudo obtener tu ubicación.');
    }
  }, []);

  const alCambiarBounds = useCallback(
    async (b: Bounds & { zoom: number }) => {
      ultimoBounds.current = b;
      const span = Math.max(b.norte - b.sur, b.este - b.oeste);
      // Los supermercados salen de Overpass (pesado): solo se cargan de cerca. Los restaurantes
      // salen de nuestra base (consulta acotada con límite), así que se pueden ver más alejados.
      if (modo === 'supermercados' && span > MAX_SPAN_GRADOS) {
        setLejos(true);
        return;
      }
      setLejos(false);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCargando(true);
      setError(null);
      try {
        if (modo === 'supermercados') {
          setTiendas(await cargarSupermercados(b, ctrl.signal));
        } else {
          setRestaurantes(await cargarRestaurantes(b, ctrl.signal));
        }
      } catch (e) {
        // Una petición cancelada por otra más reciente (al mover el mapa) no es un error
        if (!ctrl.signal.aborted) {
          const que = modo === 'supermercados' ? 'los supermercados' : 'los restaurantes';
          setError(`No se pudieron cargar ${que} (${(e as Error)?.message ?? 'error desconocido'}). Mueve el mapa para reintentar.`);
        }
      } finally {
        if (abortRef.current === ctrl) setCargando(false);
      }
    },
    [modo]
  );

  // Al cambiar de modo, limpia la selección y recarga la zona visible con el otro conjunto (reset intencionado).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeleccion(null);
    setRestSel(null);
    if (listo.current && ultimoBounds.current) alCambiarBounds(ultimoBounds.current);
  }, [modo, alCambiarBounds]);

  const alMensaje = useCallback(
    (e: WebViewMessageEvent) => {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'listo') {
        listo.current = true;
        centrarEnUsuario();
      } else if (m.type === 'bounds') {
        alCambiarBounds(m);
      } else if (m.type === 'select') {
        if (modo === 'supermercados') setSeleccion(tiendas.find((t) => t.id === m.id) ?? null);
        else setRestSel(restaurantes.find((r) => r.id === m.id) ?? null);
      }
    },
    [alCambiarBounds, centrarEnUsuario, tiendas, restaurantes, modo]
  );

  const buscarLugar = async () => {
    const q = busqueda.trim();
    if (!q) return;
    Keyboard.dismiss();
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(q)}`
      );
      const r = await res.json();
      if (r[0]) run(`irA(${r[0].lat},${r[0].lon},14)`);
      else setError(`No se encontró "${q}" en España.`);
    } catch {
      setError('No se pudo buscar el lugar.');
    }
  };

  const infoProductos = (t: Tienda) => {
    const catalogo = PRODUCTOS.filter((p) => p.supermercados.includes(t.cadena.nombreCatalogo));
    const aptos = catalogo.filter(
      (p) => evaluarCompatibilidad(p, perfil.intolerancias).estado === 'apto'
    ).length;
    return { total: catalogo.length, aptos };
  };

  const resumen = seleccion ? infoProductos(seleccion) : null;
  const km = seleccion && usuario ? distanciaKm(usuario.lat, usuario.lon, seleccion.lat, seleccion.lon) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>{modo === 'supermercados' ? 'Dónde comprar' : 'Dónde comer'}</Text>
        <View style={styles.selectorModo}>
          <SoftPressable
            style={[styles.modoBtn, modo === 'supermercados' && styles.modoBtnActivo]}
            onPress={() => setModo('supermercados')}
            haptica
          >
            <Icono nombre="store" tamano={16} color={modo === 'supermercados' ? '#fff' : colors.textMutedOnDark} grosor={2.1} />
            <Text style={[styles.modoTexto, modo === 'supermercados' && styles.modoTextoActivo]}>Supermercados</Text>
          </SoftPressable>
          <SoftPressable
            style={[styles.modoBtn, modo === 'restaurantes' && styles.modoBtnActivo]}
            onPress={() => setModo('restaurantes')}
            haptica
          >
            <Icono nombre="pot" tamano={16} color={modo === 'restaurantes' ? '#fff' : colors.textMutedOnDark} grosor={2.1} />
            <Text style={[styles.modoTexto, modo === 'restaurantes' && styles.modoTextoActivo]}>Restaurantes</Text>
          </SoftPressable>
        </View>
        <View style={styles.filaBusqueda}>
          <TextInput
            style={styles.input}
            placeholder="Busca ciudad, barrio o código postal"
            placeholderTextColor={colors.textMutedOnDark}
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={buscarLugar}
            returnKeyType="search"
          />
          <SoftPressable style={styles.botonGps} onPress={centrarEnUsuario} haptica>
            <Icono nombre="pin" tamano={19} color={colors.accent} grosor={2.1} />
          </SoftPressable>
        </View>
        {modo === 'supermercados' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip texto="Todas" activo={filtro === null} onPress={() => setFiltro(null)} />
            {CADENAS.filter((c) => c.id !== 'otros').map((c) => (
              <Chip
                key={c.id}
                texto={c.nombre}
                color={c.color}
                activo={filtro === c.id}
                onPress={() => setFiltro(filtro === c.id ? null : c.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {WebView ? (
          <WebView
            ref={web}
            originWhitelist={['*']}
            source={{ html: MAPA_HTML, baseUrl: 'https://libre.local/' }}
            onMessage={alMensaje}
            javaScriptEnabled
            style={{ flex: 1, backgroundColor: colors.bgAlt }}
          />
        ) : (
          <View style={styles.sinMapa}>
            <Text style={styles.estadoTexto}>
              El mapa no está disponible en esta versión de la app. Recompílala con
              {' `npx expo run:android` '}o ábrela con Expo Go.
            </Text>
          </View>
        )}
        <View style={styles.estado} pointerEvents="none">
          {cargando && <ActivityIndicator color="#fff" size="small" />}
          <Text style={styles.estadoTexto}>
            {lejos
              ? 'Acerca el mapa (o busca una ciudad) para ver supermercados'
              : error ??
                (modo === 'supermercados'
                  ? `${visibles.length} supermercados en esta zona`
                  : `${restaurantes.length} restaurantes en esta zona`)}
          </Text>
        </View>

        {seleccion && resumen && (
          <Aparece key={seleccion.id} style={styles.hoja}>
            <View style={styles.hojaCabecera}>
              <View style={[styles.punto, { backgroundColor: seleccion.cadena.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.hojaNombre}>{seleccion.nombre}</Text>
                <Text style={styles.hojaMeta}>
                  {[seleccion.cadena.nombre, km != null ? `${km.toFixed(1)} km` : null, seleccion.direccion]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {seleccion.horario ? <Text style={styles.hojaMeta}>🕒 {seleccion.horario}</Text> : null}
              </View>
              <Pressable onPress={() => setSeleccion(null)} hitSlop={10}>
                <Icono nombre="close" tamano={16} color={colors.textMuted} grosor={2.2} />
              </Pressable>
            </View>
            <Text style={styles.hojaProductos}>
              {resumen.total > 0
                ? `${resumen.aptos} de ${resumen.total} productos de nuestro catálogo son aptos para tu perfil`
                : 'Aún no tenemos productos verificados de esta cadena en el catálogo.'}
            </Text>
            {seleccion.cadena.tagOff ? (
              <Pressable
                style={styles.boton}
                onPress={() => router.push({ pathname: '/cadena/[id]', params: { id: seleccion.cadena.id } })}
              >
                <Text style={styles.botonTexto}>Ver productos para mi perfil en {seleccion.cadena.nombre}</Text>
              </Pressable>
            ) : null}
          </Aparece>
        )}

        {modo === 'restaurantes' && !restSel && (
          <SoftPressable style={styles.botonAnadir} onPress={() => router.push('/restaurante/nuevo')} haptica>
            <Icono nombre="plus" tamano={16} color="#fff" grosor={2.6} />
            <Text style={styles.botonAnadirTexto}>Añadir restaurante</Text>
          </SoftPressable>
        )}

        {modo === 'restaurantes' && restSel && (
          <Aparece key={restSel.id} style={styles.hoja}>
            <View style={styles.hojaCabecera}>
              <View style={[styles.punto, { backgroundColor: COLOR_REST }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.hojaNombre}>{restSel.nombre}</Text>
                <Text style={styles.hojaMeta}>
                  {[restSel.tipo_cocina, restSel.ciudad].filter(Boolean).join(' · ') || 'Restaurante de la comunidad'}
                </Text>
                <Text style={styles.hojaMeta}>
                  {restSel.num_valoraciones > 0
                    ? `★ ${restSel.media_estrellas.toFixed(1)} · ${restSel.num_valoraciones} valoración${
                        restSel.num_valoraciones === 1 ? '' : 'es'
                      }`
                    : 'Aún sin valoraciones'}
                </Text>
              </View>
              <Pressable onPress={() => setRestSel(null)} hitSlop={10}>
                <Icono nombre="close" tamano={16} color={colors.textMuted} grosor={2.2} />
              </Pressable>
            </View>
            {restSel.analisis && Object.keys(restSel.analisis.flags).length > 0 && (
              <View style={{ gap: 6 }}>
                <View style={styles.analisisChips}>
                  {Object.entries(restSel.analisis.flags).map(([k, v]) => {
                    const c = colorApto(v);
                    return (
                      <View key={k} style={[styles.aChip, { backgroundColor: c.bg }]}>
                        <Text style={[styles.aChipTxt, { color: c.fg }]}>
                          {APTO_LABEL[k] ?? k}{v === 'dudoso' ? ' ?' : v === 'no' ? ' ✕' : ' ✓'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.analisisNota}>Según su web. Confírmalo siempre en el restaurante.</Text>
              </View>
            )}
            <Pressable
              style={styles.boton}
              onPress={() => router.push({ pathname: '/restaurante/[id]', params: { id: restSel.id } })}
            >
              <Text style={styles.botonTexto}>Ver ficha y valorar</Text>
            </Pressable>
          </Aparece>
        )}
      </View>
    </SafeAreaView>
  );
}

function Chip({
  texto,
  activo,
  onPress,
  color,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <SoftPressable onPress={onPress} style={[styles.chip, activo && { backgroundColor: color ?? colors.accent }]}>
      <Text style={[styles.chipTexto, activo && { color: '#fff' }]}>{texto}</Text>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  cabecera: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  titulo: { fontSize: 23, fontWeight: '800', color: colors.textOnDark, marginBottom: 10 },
  selectorModo: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modoBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modoBtnActivo: { backgroundColor: colors.accent },
  modoTexto: { color: colors.textMutedOnDark, fontSize: 13, fontWeight: '700' },
  modoTextoActivo: { color: '#fff' },
  botonAnadir: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR_REST,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    ...sombra,
  },
  botonAnadirTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filaBusqueda: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textOnDark,
    fontFamily: fuente.regular,
  },
  botonGps: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
  },
  chips: { gap: 8, paddingTop: 10, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.bgAlt,
  },
  chipTexto: { color: colors.textMutedOnDark, fontSize: 12, fontWeight: '600' },
  estado: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(34,37,46,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '92%',
  },
  sinMapa: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  estadoTexto: { color: '#fff', fontSize: 12 },
  hoja: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  hojaCabecera: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  punto: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  hojaNombre: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  hojaMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  hojaProductos: { fontSize: 12, color: colors.textDark },
  analisisChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aChip: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  aChipTxt: { fontSize: 11.5, fontWeight: '700' },
  analisisNota: { fontSize: 11, color: colors.textMuted },
  boton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
