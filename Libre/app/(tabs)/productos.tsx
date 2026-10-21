import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PRODUCTOS, Producto } from '../../src/data/productos';
import { CADENAS } from '../../src/data/cadenas';
import { DIETAS, DietaId, cumpleDietas } from '../../src/data/intolerancias';
import ProductCard from '../../src/components/ProductCard';
import GrupoChips from '../../src/components/GrupoChips';
import SelectorPerfil from '../../src/components/SelectorPerfil';
import SoftPressable from '../../src/components/SoftPressable';
import Icono from '../../src/components/Icono';
import { SkeletonProductCard } from '../../src/components/Skeleton';
import { consultarProductos, supabaseConfigurado, OrdenDb } from '../../src/lib/catalogoRemoto';
import { guardarEnCache } from '../../src/lib/productCache';
import { evaluarCompatibilidad } from '../../src/lib/compatibilidad';
import { usePerfil } from '../../src/lib/PerfilContext';
import { colors, fuente, radius, sombra } from '../../src/theme';

const CATEGORIAS_DB = [
  { id: 'todas', label: 'Todas' },
  { id: 'en:dairies', label: '🥛 Lácteos' },
  { id: 'en:cheeses', label: '🧀 Quesos' },
  { id: 'en:yogurts', label: '🥣 Yogures' },
  { id: 'en:meats-and-their-products', label: '🥩 Carnes' },
  { id: 'en:fishes-and-their-products', label: '🐟 Pescado' },
  { id: 'en:breads', label: '🍞 Pan' },
  { id: 'en:cereals-and-potatoes', label: '🌾 Cereales' },
  { id: 'en:fruits-and-vegetables-based-foods', label: '🥕 Frutas y verduras' },
  { id: 'en:legumes-and-their-products', label: '🫘 Legumbres' },
  { id: 'en:nuts-and-their-products', label: '🌰 Frutos secos' },
  { id: 'en:beverages', label: '🥤 Bebidas' },
  { id: 'en:plant-based-beverages', label: '🌱 Bebidas vegetales' },
  { id: 'en:snacks', label: '🍿 Snacks' },
  { id: 'en:biscuits-and-cakes', label: '🍪 Galletas y bollería' },
  { id: 'en:sweet-snacks', label: '🍬 Dulces' },
  { id: 'en:cocoa-and-its-products', label: '🍫 Chocolate' },
  { id: 'en:spreads', label: '🥜 Untables' },
  { id: 'en:breakfasts', label: '🌅 Desayunos' },
  { id: 'en:desserts', label: '🍰 Postres' },
  { id: 'en:meals', label: '🍲 Platos preparados' },
  { id: 'en:canned-foods', label: '🥫 Conservas' },
  { id: 'en:frozen-foods', label: '🧊 Congelados' },
  { id: 'en:sauces', label: '🍅 Salsas' },
  { id: 'en:condiments', label: '🧂 Condimentos' },
];
const SUPERS_DB = [{ id: 'todos', label: 'Todos' }, ...CADENAS.filter((c) => c.id !== 'otros').map((c) => ({ id: c.id, label: c.nombre }))];
const ESTADOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'compatibles', label: '✅ Solo aptos (sin trazas)' },
  { id: 'sin_no_aptos', label: 'Sin mis alérgenos' },
];
const PRECIOS = [
  { id: '0', label: 'Cualquiera' },
  { id: '2', label: 'Hasta 2 €' },
  { id: '4', label: 'Hasta 4 €' },
  { id: '8', label: 'Hasta 8 €' },
];
const NUTRISCORES = [
  { id: 'todos', label: 'Todos' },
  { id: 'ab', label: 'Nutri-Score A-B' },
  { id: 'abc', label: 'Nutri-Score A-C' },
];
const ORDENES = [
  { id: 'relevancia', label: 'Sugeridos' },
  { id: 'precio', label: 'Más baratos' },
  { id: 'nutriscore', label: 'Más saludables' },
  { id: 'nombre', label: 'A-Z' },
];

export default function ProductosScreen() {
  const { perfil } = usePerfil();
  const [texto, setTexto] = useState('');
  const [textoBuscado, setTextoBuscado] = useState('');
  const [verFiltros, setVerFiltros] = useState(false);
  const [estado, setEstado] = useState(perfil.intolerancias.length > 0 ? 'sin_no_aptos' : 'todos');
  const [categoria, setCategoria] = useState('todas');
  const [supermercado, setSupermercado] = useState('todos');
  const [precio, setPrecio] = useState('0');
  const [nutri, setNutri] = useState('todos');
  const [orden, setOrden] = useState('relevancia');
  const [dietas, setDietas] = useState<string[]>(perfil.dietas);

  const [items, setItems] = useState<Producto[]>([]);
  const [pagina, setPagina] = useState(0);
  const [, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [fin, setFin] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const pedido = useRef(0);

  // Cada perfil parte de sus propias intolerancias y dieta (reset intencionado al cambiar de perfil)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado(perfil.intolerancias.length > 0 ? 'sin_no_aptos' : 'todos');
    setDietas(perfil.dietas);
  }, [perfil.id, perfil.intolerancias, perfil.dietas]);

  // La búsqueda por texto se lanza al dejar de escribir
  useEffect(() => {
    const t = setTimeout(() => setTextoBuscado(texto.trim()), 400);
    return () => clearTimeout(t);
  }, [texto]);

  const cargar = useCallback(
    async (pag: number) => {
      const id = ++pedido.current;
      setCargando(true);
      setSinConexion(false);
      try {
        const r = await consultarProductos({
          texto: textoBuscado.length >= 2 ? textoBuscado : undefined,
          supermercadoId: supermercado !== 'todos' ? supermercado : undefined,
          categoriaTag: categoria !== 'todas' ? categoria : undefined,
          precioMax: Number(precio) || undefined,
          nutriscore: nutri === 'ab' ? ['a', 'b'] : nutri === 'abc' ? ['a', 'b', 'c'] : undefined,
          orden: orden as OrdenDb,
          intolerancias: perfil.intolerancias,
          excluirAlergenos: estado !== 'todos',
          excluirTrazas: estado === 'compatibles',
          pagina: pag,
          contar: false, // esta pantalla no muestra el total: evita el count caro en cada búsqueda
        });
        if (id !== pedido.current) return; // llegó tarde: ya hay una búsqueda más reciente
        // Además del filtro de la base de datos, se revisan los ingredientes de cada producto
        const validos =
          estado === 'todos'
            ? r.productos
            : r.productos.filter((p) => {
                const e = evaluarCompatibilidad(p, perfil.intolerancias).estado;
                return estado === 'compatibles' ? e === 'apto' : e !== 'no_apto';
              });
        validos.forEach(guardarEnCache);
        setItems((prev) =>
          pag === 1 ? validos : [...prev, ...validos.filter((p) => !prev.some((q) => q.id === p.id))]
        );
        setTotal(r.total);
        setFin(r.productos.length < 24);
        setPagina(pag);
      } catch (e) {
        if (id === pedido.current) {
          setSinConexion(true);
          setDetalleError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (id === pedido.current) setCargando(false);
      }
    },
    [textoBuscado, supermercado, categoria, precio, nutri, orden, estado, perfil.intolerancias]
  );

  // Nueva búsqueda al cambiar cualquier filtro (cargar actualiza estado de forma intencionada)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (supabaseConfigurado) cargar(1);
  }, [cargar]);

  // Catálogo local: solo si no hay base de datos o no hay conexión
  const local = useMemo(() => {
    const q = textoBuscado.toLowerCase();
    const max = Number(precio);
    let lista = PRODUCTOS.filter((p) => {
      if (q && !(p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q) || p.ingredientes.toLowerCase().includes(q))) return false;
      if (max > 0 && p.precioAprox > max) return false;
      if (!cumpleDietas(p.dietas, dietas as DietaId[])) return false;
      if (estado !== 'todos') {
        const e = evaluarCompatibilidad(p, perfil.intolerancias).estado;
        if (estado === 'compatibles' && e !== 'apto') return false;
        if (estado === 'sin_no_aptos' && e === 'no_apto') return false;
      }
      return true;
    });
    if (orden === 'precio') lista = [...lista].sort((a, b) => a.precioAprox - b.precioAprox);
    else if (orden === 'nombre') lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return lista;
  }, [textoBuscado, precio, dietas, estado, orden, perfil.intolerancias]);

  const usaLocal = !supabaseConfigurado || (sinConexion && items.length === 0);
  const datos = usaLocal ? local : items;
  const hayMas = !usaLocal && !fin;
  const cargandoInicial = !usaLocal && cargando && items.length === 0;

  const numFiltros =
    (estado !== (perfil.intolerancias.length > 0 ? 'sin_no_aptos' : 'todos') ? 1 : 0) +
    (categoria !== 'todas' ? 1 : 0) +
    (supermercado !== 'todos' ? 1 : 0) +
    (precio !== '0' ? 1 : 0) +
    (nutri !== 'todos' ? 1 : 0) +
    (orden !== 'relevancia' ? 1 : 0);

  const activoFiltros = verFiltros || numFiltros > 0;

  const limpiar = () => {
    setEstado(perfil.intolerancias.length > 0 ? 'sin_no_aptos' : 'todos');
    setCategoria('todas');
    setSupermercado('todos');
    setPrecio('0');
    setNutri('todos');
    setOrden('relevancia');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.contenido}>
        <Text style={styles.titulo}>Productos para {perfil.nombre}</Text>
        <SelectorPerfil />
        <View style={styles.filaBusqueda}>
          <View style={styles.buscador}>
            <Icono nombre="search" tamano={18} color={colors.textMuted} grosor={2} />
            <TextInput
              style={styles.input}
              placeholder="Busca un producto o marca"
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
              <View style={styles.contador}>
                <Text style={styles.contadorTexto}>{numFiltros}</Text>
              </View>
            )}
          </SoftPressable>
        </View>

        {verFiltros && (
          <View style={styles.panel}>
            <ScrollView
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <GrupoChips titulo="Compatibilidad con tu perfil" opciones={ESTADOS} valor={estado} onChange={(v) => setEstado(v as string)} />
              <GrupoChips titulo="Categoría" opciones={CATEGORIAS_DB} valor={categoria} onChange={(v) => setCategoria(v as string)} />
              <GrupoChips titulo="Supermercado" opciones={SUPERS_DB} valor={supermercado} onChange={(v) => setSupermercado(v as string)} />
              <GrupoChips titulo="Precio" opciones={PRECIOS} valor={precio} onChange={(v) => setPrecio(v as string)} />
              <GrupoChips titulo="Nutri-Score" opciones={NUTRISCORES} valor={nutri} onChange={(v) => setNutri(v as string)} />
              <GrupoChips titulo="Ordenar por" opciones={ORDENES} valor={orden} onChange={(v) => setOrden(v as string)} />
              {usaLocal && (
                <GrupoChips
                  titulo="Dieta (solo catálogo sin conexión)"
                  multi
                  opciones={DIETAS.map((d) => ({ id: d.id, label: `${d.emoji} ${d.nombre}` }))}
                  valor={dietas}
                  onChange={(v) => setDietas(v as string[])}
                />
              )}
              {numFiltros > 0 && (
                <SoftPressable onPress={limpiar} style={styles.limpiar}>
                  <Text style={styles.limpiarTexto}>Quitar filtros</Text>
                </SoftPressable>
              )}
            </ScrollView>
          </View>
        )}

        <Text style={styles.resultados}>
          {usaLocal
            ? `${datos.length} productos (catálogo sin conexión)`
            : cargandoInicial
              ? 'Buscando…'
              : `${items.length.toLocaleString('es-ES')} productos${hayMas ? ' · desliza para ver más' : ''}`}
        </Text>

        {cargandoInicial ? (
          <View style={{ flex: 1, paddingTop: 4 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonProductCard key={i} />
            ))}
          </View>
        ) : (
          <FlashList
            data={datos}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              if (hayMas && !cargando) cargar(pagina + 1);
            }}
            ListEmptyComponent={
              cargando ? null : <Text style={styles.vacio}>No hay productos con esos filtros 🔍</Text>
            }
            ListFooterComponent={
              cargando && items.length > 0 ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: 18 }} />
              ) : sinConexion ? (
                <SoftPressable style={styles.botonMas} onPress={() => cargar(Math.max(pagina, 1))} haptica>
                  <Text style={styles.botonMasTexto}>
                    Sin conexión con el catálogo ({detalleError || 'error'}) · Reintentar
                  </Text>
                </SoftPressable>
              ) : null
            }
            renderItem={({ item }) => (
              <ProductCard
                producto={item}
                intolerancias={perfil.intolerancias}
                onPress={() => router.push(`/producto/${item.id}`)}
              />
            )}
          />
        )}
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
  contador: {
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
  contadorTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },
  panel: { backgroundColor: colors.card, ...sombra, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  limpiar: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, marginTop: 4 },
  limpiarTexto: { color: colors.coral, fontWeight: '700', fontSize: 13 },
  resultados: { fontSize: 12, color: colors.textMuted, marginBottom: 8, marginLeft: 2 },
  botonMas: { alignSelf: 'center', backgroundColor: colors.lavanda, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, marginTop: 8 },
  botonMasTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
  vacio: { textAlign: 'center', color: colors.textMutedOnDark, marginTop: 40 },
});
