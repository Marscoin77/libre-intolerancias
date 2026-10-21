import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { PRODUCTOS, Producto } from '../../src/data/productos';
import { nombreIntolerancia } from '../../src/data/intolerancias';
import FotoProducto from '../../src/components/FotoProducto';
import Veredicto from '../../src/components/Veredicto';
import NutriScore from '../../src/components/NutriScore';
import Icono from '../../src/components/Icono';
import SoftPressable from '../../src/components/SoftPressable';
import { obtenerDeCache } from '../../src/lib/productCache';
import { usePerfil } from '../../src/lib/PerfilContext';
import { useListaCompra } from '../../src/lib/ListaCompraContext';
import { evaluarCompatibilidad } from '../../src/lib/compatibilidad';
import { avisosCategoria } from '../../src/data/recomendacionesEdad';
import { colors, radius, sombra } from '../../src/theme';

export default function ProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { perfil } = usePerfil();
  const { añadirItems } = useListaCompra();

  const producto = PRODUCTOS.find((p) => p.id === id) ?? obtenerDeCache(id ?? '');

  if (!producto) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.vacio}>No se ha encontrado este producto.</Text>
      </SafeAreaView>
    );
  }

  const resultado = evaluarCompatibilidad(producto, perfil.intolerancias);
  const avisosEdad = avisosCategoria(producto.categoria, perfil.edad);
  const enConflicto = new Set(resultado.intoleranciasEnConflicto);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        {/* Cabecera: foto grande con degradado hacia el fondo */}
        <View style={styles.hero}>
          <FotoProducto
            producto={{ ...producto, imagen: producto.fotoGrande ?? producto.imagen }}
            tamano="100%"
            style={styles.foto}
          />
        </View>

        <View style={styles.cabeceraTexto}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre}>{producto.nombre}</Text>
            <Text style={styles.categoria}>{producto.categoria}</Text>
            {esCatalogoLibre(producto) && producto.calidad > 0 && (
              <Text style={styles.calidad}>{'⭐'.repeat(producto.calidad)}</Text>
            )}
          </View>
          {producto.nutriscore && (
            <View style={styles.nutriBloque}>
              <NutriScore grado={producto.nutriscore} estimado={producto.nutriscoreEstimado} />
            </View>
          )}
        </View>
        {producto.nutriscore && producto.nutriscoreEstimado && (
          <Text style={styles.notaNutri}>
            Nutri-Score calculado por Libre a partir de los valores nutricionales (aproximado, no oficial).
          </Text>
        )}

        {/* Veredicto en barra */}
        <View style={{ marginTop: 16 }}>
          <Veredicto estado={resultado.estado} variante="barra" motivo={resultado.motivo} />
        </View>

        {/* Chips de alérgenos declarados / trazas */}
        {(producto.alergenos.length > 0 || producto.trazas.length > 0) && (
          <View style={styles.chipsBloque}>
            {producto.alergenos.length > 0 && (
              <>
                <Text style={styles.label}>Alérgenos declarados</Text>
                <View style={styles.chips}>
                  {producto.alergenos.map((a) => (
                    <View key={a} style={[styles.chip, enConflicto.has(a) && styles.chipBad]}>
                      <Text style={[styles.chipTexto, enConflicto.has(a) && styles.chipTextoBad]}>
                        {nombreIntolerancia(a)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {producto.trazas.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: 10 }]}>Puede contener trazas de</Text>
                <View style={styles.chips}>
                  {producto.trazas.map((t) => (
                    <View key={t} style={styles.chip}>
                      <Text style={styles.chipTexto}>{nombreIntolerancia(t)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {avisosEdad.length > 0 && (
          <View style={styles.avisoEdad}>
            <View style={styles.avisoEdadCabecera}>
              <Icono nombre="warn" tamano={16} color={colors.warningText} grosor={2.2} />
              <Text style={styles.avisoEdadTitulo}>
                Aviso para {perfil.nombre} ({perfil.edad} años)
              </Text>
            </View>
            {avisosEdad.map((a, i) => (
              <Text key={i} style={styles.avisoEdadTexto}>
                • {a}
              </Text>
            ))}
          </View>
        )}

        <Seccion titulo="Ingredientes" icono="list">
          <Text style={styles.texto}>{producto.ingredientes}</Text>
        </Seccion>

        {producto.precioAprox > 0 && (
          <Seccion titulo={`Precio ${producto.precioTipo === 'real' ? 'registrado' : 'orientativo'}`} icono="store">
            <Text style={styles.precio}>
              {producto.precioTipo === 'estimado' ? '≈ ' : ''}
              {producto.precioAprox.toFixed(2)} €
            </Text>
            {producto.precioTipo === 'estimado' && (
              <Text style={styles.nota}>Estimación a partir de productos similares: no es un precio real.</Text>
            )}
          </Seccion>
        )}

        {producto.nutricion && (
          <Seccion titulo="Información nutricional (por 100 g)" icono="pot">
            {FILAS_NUTRICION.map(([clave, etiqueta, unidad, ref]) => {
              const v = producto.nutricion?.[clave];
              if (v == null) return null;
              const pct = Math.max(2, Math.min(100, (v / ref) * 100));
              return (
                <View key={clave} style={styles.barra}>
                  <View style={styles.barraTop}>
                    <Text style={styles.texto}>{etiqueta}</Text>
                    <Text style={styles.textoNegrita}>
                      {Number(v.toFixed(1))} {unidad}
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </Seccion>
        )}

        {(producto.fotoIngredientes || producto.fotoNutricion) && (
          <Seccion titulo="Etiqueta del producto" icono="camera">
            {producto.fotoIngredientes && (
              <>
                <Text style={styles.nota}>Ingredientes</Text>
                <Image source={producto.fotoIngredientes} style={styles.fotoEtiqueta} contentFit="contain" transition={200} />
              </>
            )}
            {producto.fotoNutricion && (
              <>
                <Text style={[styles.nota, { marginTop: 10 }]}>Tabla nutricional</Text>
                <Image source={producto.fotoNutricion} style={styles.fotoEtiqueta} contentFit="contain" transition={200} />
              </>
            )}
          </Seccion>
        )}

        {producto.supermercados.length > 0 && (
          <Seccion titulo="Dónde comprarlo" icono="pin">
            <View style={styles.chips}>
              {producto.supermercados.map((s) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipTexto}>{s}</Text>
                </View>
              ))}
            </View>
          </Seccion>
        )}

        <View style={styles.fuenteBox}>
          <Text style={styles.fuenteTexto}>
            Fuente: {producto.fuente} · Verificado: {producto.fechaVerificacion}
          </Text>
        </View>

        <SoftPressable
          style={styles.boton}
          haptica
          onPress={() => {
            añadirItems([producto.nombre], 'Ficha de producto');
            Alert.alert('Añadido', `${producto.nombre} se ha añadido a tu lista de la compra.`);
          }}
        >
          <Icono nombre="plus" tamano={18} color="#fff" grosor={2.4} />
          <Text style={styles.botonTexto}>Añadir a la lista de la compra</Text>
        </SoftPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Tarjeta de sección con título e icono. */
function Seccion({ titulo, icono, children }: { titulo: string; icono: Parameters<typeof Icono>[0]['nombre']; children: React.ReactNode }) {
  return (
    <View style={styles.seccionBox}>
      <View style={styles.seccionCabecera}>
        <Icono nombre={icono} tamano={16} color={colors.accent} grosor={2.1} />
        <Text style={styles.seccionTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const FILAS_NUTRICION: [keyof NonNullable<Producto['nutricion']>, string, string, number][] = [
  ['kcal', 'Energía', 'kcal', 600],
  ['grasas', 'Grasas', 'g', 50],
  ['saturadas', 'de las cuales saturadas', 'g', 25],
  ['hidratos', 'Hidratos de carbono', 'g', 80],
  ['azucares', 'de los cuales azúcares', 'g', 50],
  ['fibra', 'Fibra', 'g', 15],
  ['proteinas', 'Proteínas', 'g', 30],
  ['sal', 'Sal', 'g', 5],
];

/** Los productos del catálogo propio de Libre (p1…, x1…) tienen valoración de calidad; los de la base de datos no. */
const esCatalogoLibre = (p: Producto) => /^[px]\d+$/.test(p.id);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60 },
  vacio: { textAlign: 'center', color: colors.textMutedOnDark, marginTop: 40 },
  hero: {
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    ...sombra,
    padding: 10,
    marginBottom: 16,
  },
  foto: { borderRadius: radius.lg, height: 220 },
  cabeceraTexto: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nombre: { fontSize: 21, fontWeight: '800', color: colors.textOnDark, lineHeight: 27 },
  categoria: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  calidad: { fontSize: 14, marginTop: 6 },
  nutriBloque: { paddingTop: 2 },
  notaNutri: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 8 },
  chipsBloque: { marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipBad: { backgroundColor: colors.noAptoBg, borderColor: 'transparent' },
  chipTexto: { fontSize: 12.5, fontWeight: '600', color: colors.textDark },
  chipTextoBad: { color: colors.noApto, fontWeight: '700' },
  avisoEdad: {
    marginTop: 18,
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  avisoEdadCabecera: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  avisoEdadTitulo: { fontWeight: '700', color: colors.warningText, fontSize: 14 },
  avisoEdadTexto: { fontSize: 13, color: colors.warningText, lineHeight: 20, marginTop: 2 },
  seccionBox: {
    marginTop: 16,
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.lg,
    padding: 16,
  },
  seccionCabecera: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  seccionTitulo: { fontSize: 14.5, fontWeight: '800', color: colors.textOnDark },
  texto: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
  textoNegrita: { fontSize: 14, color: colors.textDark, fontWeight: '700' },
  precio: { fontSize: 20, color: colors.accentDeep, fontWeight: '800' },
  nota: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  barra: { marginBottom: 12 },
  barraTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  track: { height: 7, borderRadius: 99, backgroundColor: colors.surface2, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 99, backgroundColor: colors.accent },
  fotoEtiqueta: { width: '100%', height: 220, marginTop: 6, borderRadius: radius.md, backgroundColor: '#fff' },
  fuenteBox: { marginTop: 16, backgroundColor: colors.bgAlt, borderRadius: radius.md, padding: 12 },
  fuenteTexto: { fontSize: 12, color: colors.textMutedOnDark, lineHeight: 17 },
  boton: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
