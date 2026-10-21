import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from '../../src/components/Texto';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import ProductCard from '../../src/components/ProductCard';
import SoftPressable from '../../src/components/SoftPressable';
import { CADENAS } from '../../src/data/cadenas';
import { PRODUCTOS, Producto } from '../../src/data/productos';
import { buscarProductosCadena } from '../../src/lib/catalogoRemoto';
import { guardarEnCache } from '../../src/lib/productCache';
import { usePerfil } from '../../src/lib/PerfilContext';
import { evaluarCompatibilidad } from '../../src/lib/compatibilidad';
import { colors, radius } from '../../src/theme';

export default function CadenaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { perfil } = usePerfil();
  const cadena = CADENAS.find((c) => c.id === id);

  const [remotos, setRemotos] = useState<Producto[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(
    async (p: number) => {
      if (!cadena) return;
      setCargando(true);
      setError(false);
      try {
        const r = await buscarProductosCadena(cadena.id, perfil.intolerancias, p);
        r.productos.forEach(guardarEnCache);
        setRemotos((prev) => (p === 1 ? r.productos : [...prev, ...r.productos]));
        if (p === 1) setTotal(r.total); // el total solo llega en la 1ª página (count=exact)
        setPagina(p);
      } catch {
        setError(true);
      } finally {
        setCargando(false);
      }
    },
    [cadena, perfil.intolerancias]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar(1);
  }, [cargar]);

  const curados = useMemo(
    () =>
      cadena
        ? PRODUCTOS.filter(
            (p) =>
              p.supermercados.includes(cadena.nombreCatalogo) &&
              evaluarCompatibilidad(p, perfil.intolerancias).estado !== 'no_apto'
          )
        : [],
    [cadena, perfil.intolerancias]
  );

  if (!cadena) return null;

  const datos = [...curados, ...remotos.filter((r) => !curados.some((c) => c.codigoBarras === r.codigoBarras))];
  const hayMas = remotos.length < total;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: cadena.nombre }} />
      <FlashList
        data={datos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <Text style={styles.aviso}>
            {perfil.intolerancias.length > 0
              ? 'Productos de esta cadena sin los alérgenos de tu perfil. '
              : 'Añade tus intolerancias en el perfil para filtrar. '}
            Los productos de Open Food Facts los sube la comunidad: comprueba siempre la etiqueta. No
            se pueden filtrar fructosa, sorbitol, ajo ni tomate.
          </Text>
        }
        renderItem={({ item }) => (
          <ProductCard
            producto={item}
            intolerancias={perfil.intolerancias}
            onPress={() => router.push({ pathname: '/producto/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          cargando ? null : (
            <Text style={styles.aviso}>
              {error ? 'No se pudieron cargar los productos.' : 'No hay productos registrados para esta cadena.'}
            </Text>
          )
        }
        ListFooterComponent={
          cargando ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
          ) : error ? (
            <SoftPressable style={styles.boton} onPress={() => cargar(pagina)} haptica>
              <Text style={styles.botonTexto}>Reintentar</Text>
            </SoftPressable>
          ) : hayMas ? (
            <SoftPressable style={styles.boton} onPress={() => cargar(pagina + 1)} haptica>
              <Text style={styles.botonTexto}>Cargar más</Text>
            </SoftPressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  aviso: { color: colors.textMutedOnDark, fontSize: 12, lineHeight: 17, marginBottom: 14 },
  boton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontWeight: '700' },
});
