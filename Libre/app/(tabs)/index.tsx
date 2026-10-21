import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePerfil } from '../../src/lib/PerfilContext';
import { RECETAS } from '../../src/data/recetas';
import { nombreIntolerancia } from '../../src/data/intolerancias';
import QuickAction from '../../src/components/QuickAction';
import SelectorPerfil from '../../src/components/SelectorPerfil';
import SoftPressable from '../../src/components/SoftPressable';
import Aparece from '../../src/components/Aparece';
import Icono, { NombreIcono } from '../../src/components/Icono';
import { colors, radius, sombra } from '../../src/theme';

const ACCESOS: { icono: NombreIcono; color: string; tinte: string; label: string; ruta: string }[] = [
  { icono: 'search', color: '#0A6B52', tinte: '#D8F2E8', label: 'Productos', ruta: '/productos' },
  { icono: 'pin', color: '#C6482F', tinte: '#FFE1D7', label: 'Tiendas', ruta: '/tiendas' },
  { icono: 'pot', color: '#B67D04', tinte: '#FFF0C9', label: 'Recetas', ruta: '/recetas' },
  { icono: 'barcode', color: '#2F6BD6', tinte: '#DCEBFF', label: 'Escanear', ruta: '/escaner' },
  { icono: 'camera', color: '#5A46D6', tinte: '#E4DDFF', label: 'Etiqueta', ruta: '/etiqueta' },
  { icono: 'user', color: '#D63384', tinte: '#FFE3EF', label: 'Perfiles', ruta: '/perfil' },
  { icono: 'list', color: '#0A6B52', tinte: '#D9F3EC', label: 'Lista', ruta: '/lista' },
];

export default function InicioScreen() {
  const { perfil } = usePerfil();
  const recomendada = RECETAS[0];
  const resumen = perfil.intolerancias.slice(0, 3).map(nombreIntolerancia).join(' · ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <Aparece>
          <LinearGradient
            colors={[colors.accentDeep, colors.accent, colors.lavanda]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroBurbuja1} />
            <View style={styles.heroBurbuja2} />
            <Text style={styles.saludo}>Hola, {perfil.nombre} 👋</Text>
            <Text style={styles.titulo}>Come sin miedo,{'\n'}vive sin límites</Text>
            {perfil.intolerancias.length > 0 && (
              <View style={styles.heroPill}>
                <Icono nombre="shield" tamano={14} color="#fff" grosor={2.2} />
                <Text style={styles.heroPillTexto} numberOfLines={1}>
                  {resumen}
                  {perfil.intolerancias.length > 3 ? ` +${perfil.intolerancias.length - 3}` : ''}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Aparece>

        <Aparece retraso={80} style={{ marginTop: 16 }}>
          <SelectorPerfil />
          <SoftPressable style={styles.buscador} onPress={() => router.push('/productos')} escala={0.98} haptica>
            <Icono nombre="search" tamano={19} color={colors.accent} grosor={2} />
            <Text style={styles.buscadorTexto}>Buscar productos, recetas…</Text>
          </SoftPressable>
        </Aparece>

        {perfil.intolerancias.length === 0 && (
          <Aparece retraso={120}>
            <SoftPressable style={styles.avisoBox} onPress={() => router.push('/perfil')} escala={0.98} haptica>
              <Text style={styles.avisoTexto}>
                ✨ Aún no has configurado las intolerancias de {perfil.nombre}. Toca aquí para personalizar
                toda la app.
              </Text>
            </SoftPressable>
          </Aparece>
        )}

        <View style={styles.grid}>
          {ACCESOS.map((a, i) => (
            <Aparece key={a.ruta} retraso={160 + i * 50}>
              <QuickAction
                icono={a.icono}
                color={a.color}
                label={a.label}
                tinte={a.tinte}
                onPress={() => router.push(a.ruta as never)}
              />
            </Aparece>
          ))}
        </View>

        <Text style={styles.seccionTitulo}>Hoy te recomendamos</Text>
        <Aparece retraso={480}>
          <SoftPressable
            style={styles.recomendacion}
            onPress={() => router.push(`/receta/${recomendada.id}`)}
            escala={0.98}
            haptica
          >
            <View style={styles.recomendacionIcono}>
              <Text style={styles.recomendacionEmoji}>{recomendada.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recomendacionNombre}>{recomendada.nombre}</Text>
              <Text style={styles.recomendacionMeta}>
                ⏱ {recomendada.tiempoMin} min · {recomendada.dificultad}
              </Text>
            </View>
            <Icono nombre="chevron" tamano={20} color={colors.textMuted} grosor={2.2} />
          </SoftPressable>
        </Aparece>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  hero: {
    borderRadius: radius.xl,
    paddingVertical: 26,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  heroBurbuja1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.13)', top: -44, right: -30 },
  heroBurbuja2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', bottom: -26, left: -18 },
  saludo: { fontSize: 13.5, color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
  titulo: { fontSize: 25, fontWeight: '800', color: '#fff', marginTop: 6, lineHeight: 31 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  heroPillTexto: { color: '#fff', fontSize: 12, fontWeight: '600', flexShrink: 1 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.xl,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  buscadorTexto: { color: colors.textMuted, fontSize: 14 },
  avisoBox: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 18,
  },
  avisoTexto: { fontSize: 13, color: colors.warningText, lineHeight: 19 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    columnGap: 12,
    marginBottom: 8,
  },
  seccionTitulo: { fontSize: 18, fontWeight: '800', color: colors.textOnDark, marginTop: 22, marginBottom: 12 },
  recomendacion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.xl,
    padding: 14,
    gap: 14,
  },
  recomendacionIcono: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recomendacionEmoji: { fontSize: 30 },
  recomendacionNombre: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  recomendacionMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
