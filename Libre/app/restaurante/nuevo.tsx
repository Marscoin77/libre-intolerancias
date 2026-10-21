import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Text } from '../../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { anadirRestaurante } from '../../src/lib/comunidad';
import SoftPressable from '../../src/components/SoftPressable';
import Icono from '../../src/components/Icono';
import { colors, fuente, radius, sombra } from '../../src/theme';

/**
 * Alta de restaurante. La posición del pin se toma del GPS; si no hay permiso o falla, se
 * intenta geocodificar "dirección, ciudad" con Nominatim (OpenStreetMap) al guardar.
 * Se puede llegar con lat/lon ya fijados (p. ej. desde el punto donde se tocó el mapa).
 */
export default function NuevoRestauranteScreen() {
  const params = useLocalSearchParams<{ lat?: string; lon?: string }>();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [tipoCocina, setTipoCocina] = useState('');
  const [telefono, setTelefono] = useState('');
  const [web, setWeb] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    params.lat && params.lon ? { lat: Number(params.lat), lon: Number(params.lon) } : null
  );
  const [estadoGps, setEstadoGps] = useState(params.lat ? 'Ubicación fijada desde el mapa.' : 'Obteniendo tu ubicación…');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (coords) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setEstadoGps('Sin permiso de ubicación: se usará la dirección que escribas.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setEstadoGps('📍 Se usará tu ubicación actual como sitio del restaurante.');
      } catch {
        setEstadoGps('No se pudo obtener el GPS: se usará la dirección que escribas.');
      }
    })();
  }, [coords]);

  async function geocodificar(): Promise<{ lat: number; lon: number } | null> {
    const q = [direccion, ciudad].filter(Boolean).join(', ').trim();
    if (!q) return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(q)}`
      );
      const r = await res.json();
      if (r[0]) return { lat: Number(r[0].lat), lon: Number(r[0].lon) };
    } catch {
      // se maneja abajo
    }
    return null;
  }

  async function guardar() {
    if (nombre.trim().length < 2) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del restaurante.');
      return;
    }
    setGuardando(true);
    try {
      const pos = coords ?? (await geocodificar());
      if (!pos) {
        setGuardando(false);
        Alert.alert(
          'No se pudo situar el restaurante',
          'Activa la ubicación o escribe la dirección y la ciudad para poder colocarlo en el mapa.'
        );
        return;
      }
      const id = await anadirRestaurante({
        nombre: nombre.trim(),
        direccion: direccion.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        lat: pos.lat,
        lon: pos.lon,
        tipo_cocina: tipoCocina.trim() || undefined,
        telefono: telefono.trim() || undefined,
        sitio_web: web.trim() || undefined,
      });
      router.replace({ pathname: '/restaurante/[id]', params: { id } });
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message ?? 'No se pudo guardar el restaurante.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Añadir restaurante</Text>
        <Text style={styles.estado}>{estadoGps}</Text>

        <Campo etiqueta="Nombre *" valor={nombre} onChange={setNombre} placeholder="Ej: La Tavola Sin Gluten" max={80} />
        <Campo etiqueta="Tipo de cocina" valor={tipoCocina} onChange={setTipoCocina} placeholder="Ej: Italiano, sin gluten" max={40} />
        <Campo etiqueta="Dirección" valor={direccion} onChange={setDireccion} placeholder="Calle y número" max={160} />
        <Campo etiqueta="Ciudad" valor={ciudad} onChange={setCiudad} placeholder="Ej: Valencia" max={80} />
        <Campo etiqueta="Teléfono" valor={telefono} onChange={setTelefono} placeholder="Opcional" max={30} keyboard="phone-pad" />
        <Campo etiqueta="Sitio web" valor={web} onChange={setWeb} placeholder="https://…" max={200} keyboard="url" />

        <Text style={styles.ayuda}>
          Colócalo estando en el restaurante para que el pin quede bien situado. Podrás valorarlo después.
        </Text>

        <SoftPressable style={[styles.boton, guardando && { opacity: 0.6 }]} onPress={guardar} disabled={guardando} haptica>
          <Icono nombre="check" tamano={18} color="#fff" grosor={2.6} />
          <Text style={styles.botonTexto}>{guardando ? 'Guardando…' : 'Guardar restaurante'}</Text>
        </SoftPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  placeholder,
  max,
  keyboard,
}: {
  etiqueta: string;
  valor: string;
  onChange: (t: string) => void;
  placeholder: string;
  max: number;
  keyboard?: 'phone-pad' | 'url';
}) {
  return (
    <>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={max}
        keyboardType={keyboard === 'phone-pad' ? 'phone-pad' : 'default'}
        autoCapitalize={keyboard === 'url' ? 'none' : 'sentences'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.textOnDark },
  estado: { fontSize: 12, color: colors.textMutedOnDark, marginTop: 6, marginBottom: 8 },
  etiqueta: { fontSize: 14, fontWeight: '700', color: colors.textOnDark, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderOnDark,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    ...sombra,
    fontSize: 15,
    fontFamily: fuente.regular,
    color: colors.textDark,
  },
  ayuda: { fontSize: 12, color: colors.textMutedOnDark, marginTop: 16, lineHeight: 18 },
  boton: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
