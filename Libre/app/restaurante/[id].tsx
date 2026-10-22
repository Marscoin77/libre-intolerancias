import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, ActivityIndicator, Linking } from 'react-native';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { INTOLERANCIAS, IntoleranciaId } from '../../src/data/intolerancias';
import { usePerfil } from '../../src/lib/PerfilContext';
import {
  GoogleInfo,
  RestauranteResumen,
  Valoracion,
  asegurarSesion,
  cargarValoraciones,
  guardarApodo,
  miValoracion,
  obtenerApodo,
  obtenerGoogle,
  obtenerRestaurante,
  reportar,
  valorar,
} from '../../src/lib/comunidad';
import { colors, radius, sombra } from '../../src/theme';

const NOMBRE_INTOL: Record<string, { nombre: string; emoji: string }> = Object.fromEntries(
  INTOLERANCIAS.map((i) => [i.id, { nombre: i.nombre, emoji: i.emoji }])
);

const APTO_LABEL: Record<string, string> = {
  gluten: 'Sin gluten', lactosa: 'Sin lactosa', huevo: 'Sin huevo',
  frutos_secos: 'Sin frutos secos', soja: 'Sin soja', vegano: 'Vegano', vegetariano: 'Vegetariano',
};
const PRECIO: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Gratis',
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};
const colorApto = (e: string) =>
  e === 'apto'
    ? { bg: colors.aptoBg, fg: colors.apto }
    : e === 'no'
      ? { bg: colors.noAptoBg, fg: colors.noApto }
      : { bg: colors.precaucionBg, fg: colors.precaucion };

/** Fila de estrellas, opcionalmente pulsables. */
function Estrellas({ valor, onChange, tam = 16 }: { valor: number; onChange?: (n: number) => void; tam?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const estrella = (
          <Text style={{ fontSize: tam, color: n <= Math.round(valor) ? '#F5B301' : colors.border }}>★</Text>
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} style={{ paddingHorizontal: 2 }}>
            {estrella}
          </Pressable>
        ) : (
          <View key={n} style={{ paddingHorizontal: 1 }}>
            {estrella}
          </View>
        );
      })}
    </View>
  );
}

export default function RestauranteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { perfil } = usePerfil();

  const [restaurante, setRestaurante] = useState<RestauranteResumen | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [google, setGoogle] = useState<GoogleInfo | null>(null);

  const [modal, setModal] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [intolOk, setIntolOk] = useState<IntoleranciaId[]>([]);
  const [apodo, setApodo] = useState('');
  const [apodoGuardado, setApodoGuardado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    setError(null);
    try {
      const [r, vs] = await Promise.all([obtenerRestaurante(id), cargarValoraciones(id)]);
      setRestaurante(r);
      setValoraciones(vs);
    } catch (e) {
      setError((e as Error)?.message ?? 'No se pudo cargar el restaurante.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  // Valoración de Google en vivo (no bloquea la carga principal; se añade cuando llega).
  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    obtenerGoogle(id, ctrl.signal)
      .then((g) => setGoogle(g))
      .catch(() => {});
    return () => ctrl.abort();
  }, [id]);

  async function abrirValorar() {
    try {
      const usuarioId = await asegurarSesion();
      const [previa, apo] = await Promise.all([miValoracion(id!), obtenerApodo(usuarioId)]);
      setApodoGuardado(apo);
      setApodo(apo ?? '');
      setEstrellas(previa?.estrellas ?? 0);
      setIntolOk(previa?.intolerancias_ok ?? []);
      setModal(true);
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message ?? 'No se pudo preparar la valoración.');
    }
  }

  async function enviarValoracion() {
    if (estrellas < 1) {
      Alert.alert('Falta la puntuación', 'Elige de 1 a 5 estrellas.');
      return;
    }
    if (!apodoGuardado && apodo.trim().length < 2) {
      Alert.alert('Elige un apodo', 'Escribe un apodo (2-24 caracteres) que se mostrará junto a tu valoración.');
      return;
    }
    setEnviando(true);
    try {
      if (!apodoGuardado) await guardarApodo(apodo);
      await valorar(id!, estrellas, intolOk);
      setModal(false);
      await cargar();
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message ?? 'No se pudo enviar la valoración.');
    } finally {
      setEnviando(false);
    }
  }

  function confirmarReporte() {
    Alert.alert('Reportar restaurante', '¿Quieres avisar de que este sitio tiene datos incorrectos o inapropiados?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reportar',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportar('restaurante', id!, 'Reportado desde la ficha');
            Alert.alert('Gracias', 'Lo revisaremos.');
          } catch (e) {
            Alert.alert('Error', (e as Error)?.message ?? 'No se pudo enviar el reporte.');
          }
        },
      },
    ]);
  }

  function toggleIntol(x: IntoleranciaId) {
    setIntolOk((a) => (a.includes(x) ? a.filter((i) => i !== x) : [...a, x]));
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!restaurante) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.vacio}>{error ?? 'No se ha encontrado este restaurante.'}</Text>
      </SafeAreaView>
    );
  }

  // ¿Cubre las intolerancias del perfil activo? (según lo que marca la gente)
  const cubiertas = new Set(valoraciones.flatMap((v) => v.intolerancias_ok));
  const delPerfil = perfil.intolerancias;
  const cubiertasPerfil = delPerfil.filter((i) => cubiertas.has(i));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.nombre}>{restaurante.nombre}</Text>
        <Text style={styles.meta}>
          {[restaurante.tipo_cocina, restaurante.ciudad, restaurante.direccion].filter(Boolean).join(' · ')}
        </Text>

        <View style={styles.filaMedia}>
          <Estrellas valor={restaurante.media_estrellas} tam={20} />
          <Text style={styles.mediaTexto}>
            {restaurante.num_valoraciones > 0
              ? `${restaurante.media_estrellas.toFixed(1)} · ${restaurante.num_valoraciones} valoración${
                  restaurante.num_valoraciones === 1 ? '' : 'es'
                }`
              : 'Aún sin valoraciones'}
          </Text>
        </View>

        {delPerfil.length > 0 && (
          <View style={[styles.perfilBox, cubiertasPerfil.length > 0 ? styles.perfilOk : styles.perfilNeutro]}>
            <Text style={styles.perfilTexto}>
              {cubiertasPerfil.length > 0
                ? `👍 La gente marca que aquí van bien: ${cubiertasPerfil
                    .map((i) => NOMBRE_INTOL[i]?.nombre ?? i)
                    .join(', ')}`
                : 'Todavía nadie ha marcado que este sitio cubra tus intolerancias.'}
            </Text>
          </View>
        )}

        {restaurante.analisis && Object.keys(restaurante.analisis.flags).length > 0 && (
          <View style={styles.analisisBox}>
            <Text style={styles.analisisTit}>Según su web</Text>
            <View style={styles.analisisChips}>
              {Object.entries(restaurante.analisis.flags).map(([k, v]) => {
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
            <Text style={styles.analisisNota}>
              Análisis automático de su web/OpenStreetMap. Oriéntate, pero confírmalo siempre en el restaurante.
            </Text>
          </View>
        )}

        {google?.disponible && (
          <View style={styles.googleBox}>
            <Text style={styles.analisisTit}>Valoración en Google</Text>
            {typeof google.rating === 'number' && (
              <View style={styles.filaMedia}>
                <Estrellas valor={google.rating} tam={18} />
                <Text style={styles.mediaTexto}>
                  {google.rating.toFixed(1)}
                  {google.total ? ` · ${google.total} reseña${google.total === 1 ? '' : 's'}` : ''}
                  {PRECIO[google.precio ?? ''] ? ` · ${PRECIO[google.precio!]}` : ''}
                </Text>
              </View>
            )}
            {google.resumen ? <Text style={styles.googleResumen}>{google.resumen}</Text> : null}
            {(google.resenas ?? []).slice(0, 3).map((rs, i) => (
              <View key={i} style={styles.resena}>
                <View style={styles.valCabecera}>
                  <Text style={styles.valApodo}>{rs.autor ?? 'Google'}</Text>
                  {typeof rs.nota === 'number' ? <Estrellas valor={rs.nota} /> : null}
                </View>
                {rs.texto ? <Text style={styles.resenaTxt} numberOfLines={5}>{rs.texto}</Text> : null}
                {rs.cuando ? <Text style={styles.resenaCuando}>{rs.cuando}</Text> : null}
              </View>
            ))}
            {google.maps_uri ? (
              <Pressable style={styles.googleBoton} onPress={() => Linking.openURL(google.maps_uri!)}>
                <Text style={styles.googleBotonTxt}>Ver carta, fotos y más reseñas en Google Maps</Text>
              </Pressable>
            ) : null}
            <Text style={styles.analisisNota}>
              Datos en vivo de Google. La carta y las fotos se abren en Google Maps.
            </Text>
          </View>
        )}

        {(restaurante.telefono || restaurante.sitio_web) && (
          <View style={styles.filaAcciones}>
            {restaurante.telefono ? (
              <Pressable style={styles.accion} onPress={() => Linking.openURL(`tel:${restaurante.telefono}`)}>
                <Text style={styles.accionTexto}>📞 Llamar</Text>
              </Pressable>
            ) : null}
            {restaurante.sitio_web ? (
              <Pressable style={styles.accion} onPress={() => Linking.openURL(restaurante.sitio_web!)}>
                <Text style={styles.accionTexto}>🌐 Web</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <Pressable style={styles.botonValorar} onPress={abrirValorar}>
          <Text style={styles.botonValorarTexto}>★ Valorar este sitio</Text>
        </Pressable>

        <Text style={styles.seccion}>Valoraciones</Text>
        {valoraciones.length === 0 ? (
          <Text style={styles.meta}>Sé el primero en valorarlo.</Text>
        ) : (
          valoraciones.map((v) => (
            <View key={v.id} style={styles.valoracion}>
              <View style={styles.valCabecera}>
                <Text style={styles.valApodo}>{v.apodo ?? 'Anónimo'}</Text>
                <Estrellas valor={v.estrellas} />
              </View>
              {v.intolerancias_ok.length > 0 && (
                <Text style={styles.valIntol}>
                  Van bien: {v.intolerancias_ok.map((i) => NOMBRE_INTOL[i]?.nombre ?? i).join(', ')}
                </Text>
              )}
            </View>
          ))
        )}

        <Pressable style={styles.reportar} onPress={confirmarReporte}>
          <Text style={styles.reportarTexto}>Reportar este restaurante</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitulo}>Valorar {restaurante.nombre}</Text>

              <Text style={styles.modalEtiqueta}>Tu puntuación</Text>
              <Estrellas valor={estrellas} onChange={setEstrellas} tam={34} />

              <Text style={styles.modalEtiqueta}>¿Qué intolerancias cubre bien?</Text>
              <View style={styles.chips}>
                {INTOLERANCIAS.map((it) => {
                  const activo = intolOk.includes(it.id);
                  return (
                    <Pressable
                      key={it.id}
                      onPress={() => toggleIntol(it.id)}
                      style={[styles.chip, activo && styles.chipActivo]}
                    >
                      <Text style={[styles.chipTexto, activo && { color: '#fff' }]}>
                        {it.emoji} {it.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {!apodoGuardado && (
                <>
                  <Text style={styles.modalEtiqueta}>Tu apodo (se mostrará junto a la valoración)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Ana_SinGluten"
                    placeholderTextColor={colors.textMuted}
                    value={apodo}
                    onChangeText={setApodo}
                    maxLength={24}
                  />
                </>
              )}

              <View style={styles.modalBotones}>
                <Pressable style={styles.modalCancelar} onPress={() => setModal(false)} disabled={enviando}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.modalEnviar} onPress={enviarValoracion} disabled={enviando}>
                  <Text style={styles.modalEnviarTexto}>{enviando ? 'Enviando…' : 'Enviar'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60 },
  vacio: { textAlign: 'center', color: colors.textMutedOnDark, marginTop: 40 },
  nombre: { fontSize: 22, fontWeight: '800', color: colors.textOnDark },
  meta: { fontSize: 13, color: colors.textMutedOnDark, marginTop: 4 },
  filaMedia: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  mediaTexto: { fontSize: 13, color: colors.textMutedOnDark },
  perfilBox: { marginTop: 12, borderRadius: radius.md, padding: 12, borderWidth: 1 },
  perfilOk: { backgroundColor: '#E4F6E9', borderColor: '#A6E0BC' },
  perfilNeutro: { backgroundColor: colors.bgAlt, borderColor: colors.border },
  perfilTexto: { fontSize: 13, color: colors.textDark, lineHeight: 19 },
  analisisBox: { marginTop: 14, backgroundColor: colors.card, ...sombra, borderRadius: radius.lg, padding: 14 },
  analisisTit: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 8 },
  analisisChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  aChip: { borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  aChipTxt: { fontSize: 12, fontWeight: '700' },
  analisisNota: { fontSize: 11, color: colors.textMuted, marginTop: 8, lineHeight: 16 },
  googleBox: { marginTop: 14, backgroundColor: colors.card, ...sombra, borderRadius: radius.lg, padding: 14 },
  googleResumen: { fontSize: 13, color: colors.textDark, marginTop: 8, lineHeight: 19 },
  resena: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  resenaTxt: { fontSize: 13, color: colors.textDark, marginTop: 5, lineHeight: 19 },
  resenaCuando: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  googleBoton: { marginTop: 12, backgroundColor: colors.bgAlt, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  googleBotonTxt: { color: colors.textOnDark, fontWeight: '700', fontSize: 13 },
  filaAcciones: { flexDirection: 'row', gap: 10, marginTop: 14 },
  accion: { backgroundColor: colors.bgAlt, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 16 },
  accionTexto: { color: colors.textOnDark, fontWeight: '600', fontSize: 13 },
  botonValorar: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonValorarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  seccion: { fontSize: 16, fontWeight: '700', color: colors.textOnDark, marginTop: 24, marginBottom: 10 },
  valoracion: {
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
  },
  valCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valApodo: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  valIntol: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  reportar: { marginTop: 20, paddingVertical: 10, alignItems: 'center' },
  reportarTexto: { color: colors.textMutedOnDark, fontSize: 12, textDecorationLine: 'underline' },
  // Modal
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCaja: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: colors.textOnDark, marginBottom: 10 },
  modalEtiqueta: { fontSize: 14, fontWeight: '700', color: colors.textOnDark, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderOnDark,
  },
  chipActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTexto: { color: colors.textMutedOnDark, fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.borderOnDark,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    fontSize: 15,
    color: colors.textDark,
  },
  modalBotones: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelar: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.bgAlt },
  modalCancelarTexto: { color: colors.textOnDark, fontWeight: '700' },
  modalEnviar: { flex: 2, paddingVertical: 13, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.accent },
  modalEnviarTexto: { color: '#fff', fontWeight: '700' },
});
