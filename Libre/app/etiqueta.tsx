import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import SoftPressable from '../src/components/SoftPressable';
import Icono, { NombreIcono } from '../src/components/Icono';
import { nombreIntolerancia } from '../src/data/intolerancias';
import { ResultadoEtiqueta, analizarEtiqueta } from '../src/lib/etiqueta';
import { usePerfil } from '../src/lib/PerfilContext';
import { colors, radius, sombra } from '../src/theme';

interface Analisis {
  uri: string;
  ancho: number;
  alto: number;
  texto: string;
  resultado: ResultadoEtiqueta;
}

const ESTILO_VEREDICTO: Record<
  'apto' | 'no_apto' | 'precaucion' | 'ilegible',
  { color: string; icono: NombreIcono; titulo: string }
> = {
  apto: { color: colors.apto, icono: 'shield', titulo: 'PARECE APTO' },
  no_apto: { color: colors.noApto, icono: 'no', titulo: 'NO APTO' },
  precaucion: { color: colors.precaucion, icono: 'warn', titulo: 'PRECAUCIÓN' },
  ilegible: { color: colors.textMuted, icono: 'question', titulo: 'NO SE PUEDE LEER' },
};

// El módulo de OCR es nativo: se carga aquí y no al importar, para que la app no se caiga
// si se abre en una versión que todavía no lo incluye (p. ej. Expo Go).
async function leerTexto(uri: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { recognizeText } = require('expo-mlkit-ocr') as typeof import('expo-mlkit-ocr');
  return recognizeText(uri);
}

export default function EtiquetaScreen() {
  const { perfil } = usePerfil();
  const { width, height } = useWindowDimensions();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState('');
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [verTexto, setVerTexto] = useState(false);

  async function analizar(uri: string) {
    setAnalizando(true);
    setError('');
    try {
      const [ocr, dims] = await Promise.all([
        leerTexto(uri),
        new Promise<{ w: number; h: number }>((res, rej) =>
          Image.getSize(uri, (w, h) => res({ w, h }), rej)
        ),
      ]);
      const lineas = ocr.blocks.flatMap((b) => b.lines);
      setAnalisis({
        uri,
        ancho: dims.w,
        alto: dims.h,
        texto: ocr.text,
        resultado: analizarEtiqueta(ocr.text, lineas, perfil.intolerancias),
      });
    } catch {
      setError(
        'No se pudo analizar la foto. Si acabas de instalar la app, comprueba que es la versión más reciente.'
      );
    } finally {
      setAnalizando(false);
    }
  }

  async function hacerFoto() {
    if (analizando) return;
    const foto = await camara.current?.takePictureAsync({ quality: 0.9 });
    if (foto?.uri) await analizar(foto.uri);
  }

  async function elegirDeGaleria() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!r.canceled && r.assets[0]) await analizar(r.assets[0].uri);
  }

  function otraFoto() {
    setAnalisis(null);
    setVerTexto(false);
    setError('');
  }

  if (!permiso) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  // ---------- Resultado ----------
  if (analisis) {
    const { resultado } = analisis;
    const estilo = ESTILO_VEREDICTO[resultado.veredicto];
    const anchoMax = width - 40;
    const escala = Math.min(anchoMax / analisis.ancho, (height * 0.5) / analisis.alto);
    const w = analisis.ancho * escala;
    const h = analisis.alto * escala;

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={[styles.marcoFoto, { borderColor: estilo.color, width: w + 12, height: h + 12 }]}>
            <View style={{ width: w, height: h }}>
              <Image source={{ uri: analisis.uri }} style={{ width: w, height: h }} resizeMode="contain" />
              {resultado.marcas.map((m, i) => (
                <View
                  key={i}
                  pointerEvents="none"
                  style={[
                    styles.marca,
                    {
                      left: m.caja.x * escala - 3,
                      top: m.caja.y * escala - 3,
                      width: m.caja.width * escala + 6,
                      height: m.caja.height * escala + 6,
                      borderColor: m.nivel === 'rojo' ? colors.noApto : colors.precaucion,
                      backgroundColor: m.nivel === 'rojo' ? 'rgba(240,96,93,0.22)' : 'rgba(245,165,36,0.22)',
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={[styles.veredicto, { backgroundColor: estilo.color }]}>
            <Icono nombre={estilo.icono} tamano={18} color="#fff" grosor={2.4} />
            <Text style={styles.veredictoTexto}>{estilo.titulo}</Text>
          </View>
          <Text style={styles.mensaje}>{resultado.mensaje}</Text>

          {resultado.conflictos.length > 0 && (
            <View style={styles.caja}>
              <View style={styles.cajaCab}>
                <Icono nombre="no" tamano={15} color={colors.noApto} grosor={2.4} />
                <Text style={styles.cajaTitulo}>Detectado en los ingredientes</Text>
              </View>
              <Text style={styles.cajaTexto}>{resultado.conflictos.map(nombreIntolerancia).join(', ')}</Text>
            </View>
          )}
          {resultado.trazas.length > 0 && (
            <View style={styles.caja}>
              <View style={styles.cajaCab}>
                <Icono nombre="warn" tamano={15} color={colors.precaucion} grosor={2.4} />
                <Text style={styles.cajaTitulo}>Posibles trazas</Text>
              </View>
              <Text style={styles.cajaTexto}>{resultado.trazas.map(nombreIntolerancia).join(', ')}</Text>
            </View>
          )}

          <SoftPressable style={styles.textoLeidoBoton} onPress={() => setVerTexto((v) => !v)}>
            <Text style={styles.textoLeidoBotonTexto}>
              {verTexto ? 'Ocultar el texto leído' : 'Ver el texto que se ha leído'}
            </Text>
          </SoftPressable>
          {verTexto && (
            <View style={styles.caja}>
              <Text style={styles.cajaTexto}>{analisis.texto || '(No se ha leído nada)'}</Text>
            </View>
          )}

          <Text style={styles.aviso}>
            Libre lee la foto de forma automática y puede equivocarse (reflejos, letra pequeña, idiomas).
            Revisa siempre la etiqueta tú mismo, sobre todo si tienes una alergia grave.
          </Text>

          <SoftPressable style={styles.boton} onPress={otraFoto} haptica>
            <Icono nombre="camera" tamano={18} color="#fff" grosor={2.2} />
            <Text style={styles.botonTexto}>Analizar otra etiqueta</Text>
          </SoftPressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Permiso de cámara ----------
  if (!permiso.granted) {
    return (
      <SafeAreaView style={styles.centro}>
        <Text style={styles.textoCentro}>Libre necesita la cámara para fotografiar etiquetas.</Text>
        <SoftPressable style={styles.boton} onPress={pedirPermiso}>
          <Text style={styles.botonTexto}>Dar permiso</Text>
        </SoftPressable>
        <SoftPressable style={styles.botonSecundario} onPress={elegirDeGaleria}>
          <Text style={styles.botonSecundarioTexto}>🖼️ Elegir una foto de la galería</Text>
        </SoftPressable>
      </SafeAreaView>
    );
  }

  // ---------- Cámara ----------
  return (
    <View style={styles.camaraFondo}>
      <CameraView ref={camara} style={StyleSheet.absoluteFill} facing="back" />
      <View style={styles.guia} pointerEvents="none">
        <View style={styles.marcoGuia} />
        <Text style={styles.instruccion}>Encuadra la lista de ingredientes de la etiqueta</Text>
        {perfil.intolerancias.length === 0 && (
          <Text style={styles.instruccionAviso}>Añade tus intolerancias en Perfiles para poder comprobarlas</Text>
        )}
      </View>

      {analizando && (
        <View style={styles.cargando}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.cargandoTexto}>Leyendo la etiqueta…</Text>
        </View>
      )}
      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <View style={styles.barra}>
        <SoftPressable style={styles.botonGaleria} onPress={elegirDeGaleria}>
          <Text style={{ fontSize: 26 }}>🖼️</Text>
        </SoftPressable>
        <SoftPressable style={styles.disparador} onPress={hacerFoto} escala={0.9}>
          <View style={styles.disparadorInterior} />
        </SoftPressable>
        <View style={styles.botonGaleria} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.bg },
  textoCentro: { textAlign: 'center', color: colors.textOnDark, fontSize: 15 },
  marcoFoto: { borderWidth: 6, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  marca: { position: 'absolute', borderWidth: 3, borderRadius: 6 },
  veredicto: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 22 },
  veredictoTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
  mensaje: { marginTop: 12, textAlign: 'center', color: colors.textOnDark, fontSize: 14, lineHeight: 21 },
  caja: { alignSelf: 'stretch', backgroundColor: colors.card, ...sombra, borderRadius: radius.md, padding: 14, marginTop: 14 },
  cajaCab: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  cajaTitulo: { fontWeight: '700', color: colors.textDark },
  cajaTexto: { color: colors.textDark, fontSize: 13, lineHeight: 19 },
  textoLeidoBoton: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 14 },
  textoLeidoBotonTexto: { color: colors.lavanda, fontWeight: '700', fontSize: 13 },
  aviso: { marginTop: 14, textAlign: 'center', color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  boton: { marginTop: 20, flexDirection: 'row', gap: 9, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botonSecundario: { paddingVertical: 12, paddingHorizontal: 18 },
  botonSecundarioTexto: { color: colors.lavanda, fontWeight: '700' },
  camaraFondo: { flex: 1, backgroundColor: '#000' },
  guia: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  marcoGuia: { width: '86%', height: '38%', borderWidth: 3, borderColor: '#fff', borderRadius: 18, opacity: 0.9 },
  instruccion: { color: '#fff', marginTop: 16, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 30 },
  instruccionAviso: { color: '#FFE28A', marginTop: 8, fontSize: 12, textAlign: 'center', paddingHorizontal: 30 },
  cargando: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  cargandoTexto: { color: '#fff', fontWeight: '600' },
  error: { position: 'absolute', top: 60, left: 20, right: 20, textAlign: 'center', color: '#fff', backgroundColor: 'rgba(214,69,69,0.92)', padding: 12, borderRadius: 12, fontSize: 13 },
  barra: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  botonGaleria: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  disparador: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  disparadorInterior: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
});
