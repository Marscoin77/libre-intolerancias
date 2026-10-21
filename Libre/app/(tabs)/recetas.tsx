import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RECETAS, recetaEsCompatible } from '../../src/data/recetas';
import { DIETAS, DietaId, cumpleDietas } from '../../src/data/intolerancias';
import { usePerfil } from '../../src/lib/PerfilContext';
import SelectorPerfil from '../../src/components/SelectorPerfil';
import GrupoChips from '../../src/components/GrupoChips';
import SoftPressable from '../../src/components/SoftPressable';
import Icono from '../../src/components/Icono';
import { colors, fuente, radius, sombra } from '../../src/theme';

const MOMENTOS = [
  { id: 'todas', label: 'Todas' },
  { id: 'Desayuno', label: '🌅 Desayuno' },
  { id: 'Comida', label: '🍽️ Comida' },
  { id: 'Merienda', label: '🍪 Merienda' },
  { id: 'Cena', label: '🌙 Cena' },
  { id: 'Postre', label: '🍰 Postre' },
];
const TIEMPOS = [
  { id: '0', label: 'Cualquiera' },
  { id: '15', label: 'Hasta 15 min' },
  { id: '30', label: 'Hasta 30 min' },
  { id: '45', label: 'Hasta 45 min' },
];
const DIFICULTADES = [
  { id: 'todas', label: 'Todas' },
  { id: 'Fácil', label: 'Fácil' },
  { id: 'Media', label: 'Media' },
  { id: 'Alta', label: 'Alta' },
];
const COSTES = [
  { id: 'todos', label: 'Todos' },
  { id: '€', label: '€ Económica' },
  { id: '€€', label: '€€ Media' },
  { id: '€€€', label: '€€€ Especial' },
];
const ORDENES = [
  { id: 'sugeridas', label: 'Sugeridas' },
  { id: 'rapidas', label: 'Más rápidas' },
  { id: 'nombre', label: 'A-Z' },
];

export default function RecetasScreen() {
  const { perfil } = usePerfil();
  const [texto, setTexto] = useState('');
  const [verFiltros, setVerFiltros] = useState(false);
  const [momento, setMomento] = useState('todas');
  const [tiempo, setTiempo] = useState('0');
  const [dificultad, setDificultad] = useState('todas');
  const [coste, setCoste] = useState('todos');
  const [orden, setOrden] = useState('sugeridas');
  const [dietas, setDietas] = useState<string[]>(perfil.dietas);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDietas(perfil.dietas), [perfil.id, perfil.dietas]);

  const compatibles = useMemo(() => RECETAS.filter((r) => recetaEsCompatible(r, perfil.intolerancias)), [perfil.intolerancias]);

  const resultados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    const maxMin = Number(tiempo);
    let lista = compatibles.filter((r) => {
      if (q && !(r.nombre.toLowerCase().includes(q) || r.ingredientes.some((i) => i.toLowerCase().includes(q)))) return false;
      if (momento !== 'todas' && r.momento !== momento) return false;
      if (maxMin > 0 && r.tiempoMin > maxMin) return false;
      if (dificultad !== 'todas' && r.dificultad !== dificultad) return false;
      if (coste !== 'todos' && r.costeAprox !== coste) return false;
      return cumpleDietas(r.dietas, dietas as DietaId[]);
    });
    if (orden === 'rapidas') lista = [...lista].sort((a, b) => a.tiempoMin - b.tiempoMin);
    else if (orden === 'nombre') lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return lista;
  }, [compatibles, texto, momento, tiempo, dificultad, coste, orden, dietas]);

  const ocultas = RECETAS.length - compatibles.length;
  const numFiltros =
    (momento !== 'todas' ? 1 : 0) +
    (tiempo !== '0' ? 1 : 0) +
    (dificultad !== 'todas' ? 1 : 0) +
    (coste !== 'todos' ? 1 : 0) +
    (orden !== 'sugeridas' ? 1 : 0) +
    dietas.length;

  const activoFiltros = verFiltros || numFiltros > 0;

  const limpiar = () => {
    setMomento('todas');
    setTiempo('0');
    setDificultad('todas');
    setCoste('todos');
    setOrden('sugeridas');
    setDietas([]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.contenido}>
        <Text style={styles.titulo}>Recetas para {perfil.nombre}</Text>
        <SelectorPerfil />

        <View style={styles.filaBusqueda}>
          <View style={styles.buscador}>
            <Icono nombre="search" tamano={18} color={colors.textMuted} grosor={2} />
            <TextInput
              style={styles.input}
              placeholder="Receta o ingrediente"
              placeholderTextColor={colors.textMuted}
              value={texto}
              onChangeText={setTexto}
            />
          </View>
          <SoftPressable
            style={[styles.botonFiltros, activoFiltros && styles.botonFiltrosActivo]}
            onPress={() => setVerFiltros((v) => !v)}
            haptica
          >
            <Icono nombre="filter" tamano={20} color={activoFiltros ? '#fff' : colors.textDark} grosor={2.2} />
            {numFiltros > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{numFiltros}</Text>
              </View>
            )}
          </SoftPressable>
        </View>

        <GrupoChips titulo="Momento" opciones={MOMENTOS} valor={momento} onChange={(v) => setMomento(v as string)} />

        {verFiltros && (
          <View style={styles.panel}>
            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <GrupoChips
                titulo="Dieta"
                multi
                opciones={DIETAS.map((d) => ({ id: d.id, label: `${d.emoji} ${d.nombre}` }))}
                valor={dietas}
                onChange={(v) => setDietas(v as string[])}
              />
              <GrupoChips titulo="Tiempo" opciones={TIEMPOS} valor={tiempo} onChange={(v) => setTiempo(v as string)} />
              <GrupoChips titulo="Dificultad" opciones={DIFICULTADES} valor={dificultad} onChange={(v) => setDificultad(v as string)} />
              <GrupoChips titulo="Coste" opciones={COSTES} valor={coste} onChange={(v) => setCoste(v as string)} />
              <GrupoChips titulo="Ordenar por" opciones={ORDENES} valor={orden} onChange={(v) => setOrden(v as string)} />
              {numFiltros > 0 && (
                <SoftPressable onPress={limpiar} style={styles.limpiar}>
                  <Text style={styles.limpiarTexto}>Quitar filtros</Text>
                </SoftPressable>
              )}
            </ScrollView>
          </View>
        )}

        <Text style={styles.contador}>
          {resultados.length} recetas
          {perfil.intolerancias.length > 0 && ocultas > 0 ? ` · ${ocultas} ocultas por tu perfil` : ''}
        </Text>
        <FlashList
          data={resultados}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.vacio}>No hay recetas con esos filtros 🍳</Text>}
          renderItem={({ item }) => (
            <SoftPressable style={styles.card} onPress={() => router.push(`/receta/${item.id}`)} escala={0.975} haptica>
              <View style={styles.emojiCaja}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.nombre} numberOfLines={2}>
                  {item.nombre}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.momento} · ⏱ {item.tiempoMin} min · {item.dificultad} · {item.costeAprox}
                </Text>
                {(item.dietas ?? []).length > 0 && (
                  <Text style={styles.dietaTag} numberOfLines={1}>
                    {(item.dietas ?? []).map((d) => DIETAS.find((x) => x.id === d)?.nombre).join(' · ')}
                  </Text>
                )}
              </View>
              <Icono nombre="chevron" tamano={18} color={colors.textMuted} grosor={2.2} />
            </SoftPressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  titulo: { fontSize: 23, fontWeight: '800', color: colors.textOnDark, marginBottom: 12 },
  filaBusqueda: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  buscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    ...sombra,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textDark,
    fontFamily: fuente.regular,
  },
  botonFiltros: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    ...sombra,
  },
  botonFiltrosActivo: { backgroundColor: colors.lavanda },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },
  panel: { backgroundColor: colors.card, ...sombra, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  limpiar: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  limpiarTexto: { color: colors.coral, fontWeight: '700', fontSize: 13 },
  contador: { fontSize: 12, color: colors.textMuted, marginBottom: 8, marginLeft: 2 },
  vacio: { textAlign: 'center', color: colors.textMutedOnDark, marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  emojiCaja: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 29 },
  nombre: { fontSize: 14.5, fontWeight: '700', color: colors.textDark, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  dietaTag: { fontSize: 11, color: colors.accentDeep, fontWeight: '600', marginTop: 4 },
});
