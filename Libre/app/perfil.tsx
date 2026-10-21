import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Switch, Alert, Platform, ToastAndroid } from 'react-native';
import { Text } from '../src/components/Texto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DIETAS, DietaId, INTOLERANCIAS, IntoleranciaId } from '../src/data/intolerancias';
import { grupoPorEdad } from '../src/data/recomendacionesEdad';
import { usePerfil } from '../src/lib/PerfilContext';
import { AVATARES, ID_PRINCIPAL, MAX_PERFILES } from '../src/lib/perfil';
import SoftPressable from '../src/components/SoftPressable';
import Icono from '../src/components/Icono';
import { colors, fuente, radius, sombra } from '../src/theme';

export default function PerfilScreen() {
  const { perfil, perfiles, cargando, actualizarPerfil, cambiarPerfil, anadirPerfil, eliminarPerfil } =
    usePerfil();
  const [nombre, setNombre] = useState('');
  const [avatar, setAvatar] = useState(AVATARES[0]);
  const [edad, setEdad] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [intolerancias, setIntolerancias] = useState<IntoleranciaId[]>([]);
  const [dietas, setDietas] = useState<DietaId[]>([]);
  const [preferencias, setPreferencias] = useState('');
  const [numPersonas, setNumPersonas] = useState('1');
  const [ubicacion, setUbicacion] = useState('');
  const [disclaimerAceptado, setDisclaimerAceptado] = useState(false);

  useEffect(() => {
    if (!cargando) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNombre(perfil.nombre);
      setAvatar(perfil.avatar);
      setEdad(perfil.edad != null ? String(perfil.edad) : '');
      setIntolerancias(perfil.intolerancias);
      setDietas(perfil.dietas);
      setPreferencias(perfil.preferencias);
      setNumPersonas(String(perfil.numPersonas || 1));
      setUbicacion(perfil.ubicacion);
      setDisclaimerAceptado(perfil.disclaimerAceptado);
    }
  }, [cargando, perfil.id]);

  async function crearPerfil() {
    const creado = await anadirPerfil(nuevoNombre);
    if (!creado) {
      Alert.alert('Máximo alcanzado', `Puedes tener hasta ${MAX_PERFILES} perfiles.`);
      return;
    }
    setNuevoNombre('');
  }

  function confirmarEliminar() {
    Alert.alert(`Eliminar perfil "${perfil.nombre}"`, 'Se borrarán sus intolerancias y preferencias.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarPerfil(perfil.id) },
    ]);
  }

  function toggleIntolerancia(id: IntoleranciaId) {
    setIntolerancias((actuales) =>
      actuales.includes(id) ? actuales.filter((i) => i !== id) : [...actuales, id]
    );
  }

  async function guardar() {
    if (!disclaimerAceptado) {
      Alert.alert(
        'Aviso importante',
        'Debes leer y aceptar el aviso sobre el uso de la información antes de guardar tu perfil.'
      );
      return;
    }
    // Edad: entero entre 0 y 120; vacío o inválido => null (sin especificar).
    const edadLimpia = parseInt(edad, 10);
    const edadFinal = Number.isNaN(edadLimpia) ? null : Math.min(120, Math.max(0, edadLimpia));
    await actualizarPerfil({
      id: perfil.id,
      nombre: nombre.trim() || perfil.nombre,
      avatar,
      edad: edadFinal,
      intolerancias,
      dietas,
      preferencias,
      numPersonas: Number(numPersonas) || 1,
      ubicacion,
      disclaimerAceptado,
    });
    // Confirmación breve que se cierra sola, sin pasos extra.
    if (Platform.OS === 'android') ToastAndroid.show('Guardado ✓', ToastAndroid.SHORT);
    // Tras guardar, vuelve a la búsqueda de productos (ya muestra "Productos para <nombre>",
    // que confirma que el perfil se aplicó) en lugar de obligar a pulsar la flecha atrás.
    router.replace('/productos');
  }

  if (cargando) return null;

  // Recomendaciones en vivo según la edad que se está escribiendo.
  const grupo = grupoPorEdad(edad.trim() === '' ? null : parseInt(edad, 10));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.seccion}>Perfiles ({perfiles.length}/{MAX_PERFILES})</Text>
        <Text style={styles.ayuda}>
          Crea un perfil para cada persona (p. ej. tu hijo). Toda la app se adapta al perfil activo.
        </Text>
        <View style={styles.chips}>
          {perfiles.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => cambiarPerfil(p.id)}
              style={[styles.chip, p.id === perfil.id && styles.chipActivo]}
            >
              <Text style={[styles.chipTexto, p.id === perfil.id && { color: '#fff' }]}>{p.avatar} {p.nombre}</Text>
            </Pressable>
          ))}
        </View>
        {perfiles.length < MAX_PERFILES && (
          <View style={styles.filaNuevo}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Nombre del nuevo perfil (ej: Lucas)"
              placeholderTextColor={colors.textMuted}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              maxLength={20}
            />
            <Pressable style={styles.botonNuevo} onPress={crearPerfil}>
              <Text style={styles.botonGuardarTexto}>Añadir</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.seccion}>Nombre del perfil</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} maxLength={20} />

        <Text style={styles.seccion}>Avatar</Text>
        <Text style={styles.ayuda}>Elige un icono para distinguir a cada persona de la familia.</Text>
        <View style={styles.avatares}>
          {AVATARES.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAvatar(a)}
              style={[styles.avatarOpcion, a === avatar && styles.avatarOpcionActivo]}
            >
              <Text style={styles.avatarEmoji}>{a}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.seccion}>Edad</Text>
        <Text style={styles.ayuda}>Opcional. Sirve para mostrarte recomendaciones adecuadas a la edad.</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Ej: 6"
          placeholderTextColor={colors.textMuted}
          value={edad}
          onChangeText={(t) => setEdad(t.replace(/[^0-9]/g, '').slice(0, 3))}
          maxLength={3}
        />

        {grupo && (
          <View style={styles.recoBox}>
            <Text style={styles.recoTitulo}>
              {grupo.emoji} Recomendaciones · {grupo.nombre}
            </Text>
            <Text style={styles.recoResumen}>{grupo.resumen}</Text>
            {grupo.consejos.map((c, i) => (
              <View key={i} style={styles.recoFila}>
                <Text style={styles.recoBullet}>•</Text>
                <Text style={styles.recoTexto}>{c}</Text>
              </View>
            ))}
            <Text style={styles.recoPie}>
              Consejos generales de carácter informativo, no un criterio médico. Ante cualquier duda,
              consulta con tu médico o pediatra.
            </Text>
          </View>
        )}

        <Text style={styles.seccion}>Intolerancias / alergias de {perfil.nombre}</Text>
        <Text style={styles.ayuda}>Selecciona las que le afectan:</Text>
        <View style={styles.lista}>
          {INTOLERANCIAS.map((it, idx) => {
            const activo = intolerancias.includes(it.id);
            return (
              <Pressable
                key={it.id}
                onPress={() => toggleIntolerancia(it.id)}
                style={[styles.fila, idx === INTOLERANCIAS.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.filaEmoji}>{it.emoji}</Text>
                <Text style={styles.filaTexto}>{it.nombre}</Text>
                <Switch value={activo} onValueChange={() => toggleIntolerancia(it.id)} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.seccion}>Tipo de dieta</Text>
        <Text style={styles.ayuda}>Se aplicará como filtro en productos y recetas:</Text>
        <View style={styles.chips}>
          {DIETAS.map((d) => {
            const activa = dietas.includes(d.id);
            return (
              <Pressable
                key={d.id}
                onPress={() => setDietas((a) => (activa ? a.filter((x) => x !== d.id) : [...a, d.id]))}
                style={[styles.chip, activa && styles.chipActivo]}
              >
                <Text style={[styles.chipTexto, activa && { color: '#fff' }]}>
                  {d.emoji} {d.nombre}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.seccion}>Otras preferencias alimentarias</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: vegetariano, sin azúcar añadido..."
          placeholderTextColor={colors.textMuted}
          value={preferencias}
          onChangeText={setPreferencias}
        />

        <Text style={styles.seccion}>Número de personas en casa</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={numPersonas}
          onChangeText={setNumPersonas}
        />

        <Text style={styles.seccion}>Ubicación habitual</Text>
        <TextInput
          style={styles.input}
          placeholder="Ciudad o barrio"
          placeholderTextColor={colors.textMuted}
          value={ubicacion}
          onChangeText={setUbicacion}
        />

        <View style={styles.avisoBox}>
          <Text style={styles.avisoTitulo}>⚠️ Aviso importante</Text>
          <Text style={styles.avisoTexto}>
            La información sobre ingredientes y alérgenos de Libre procede de etiquetados de
            fabricantes y de fuentes de terceros (como Open Food Facts) y puede no estar
            actualizada o completa. Libre no garantiza la exactitud de los datos. Verifica
            siempre el etiquetado físico del producto antes de consumirlo, especialmente si
            tienes una alergia grave. Libre es una herramienta de apoyo informativo, no un
            sustituto del criterio médico.
          </Text>
          <View style={styles.switchFila}>
            <Switch value={disclaimerAceptado} onValueChange={setDisclaimerAceptado} />
            <Text style={styles.switchTexto}>He leído y acepto este aviso</Text>
          </View>
        </View>

        <SoftPressable style={styles.botonGuardar} onPress={guardar} haptica>
          <Icono nombre="check" tamano={18} color="#fff" grosor={2.6} />
          <Text style={styles.botonGuardarTexto}>Guardar</Text>
        </SoftPressable>
        {perfiles.length > 1 && perfil.id !== ID_PRINCIPAL && (
          <Pressable style={styles.botonEliminar} onPress={confirmarEliminar}>
            <Text style={styles.botonEliminarTexto}>Eliminar este perfil</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: 20, paddingBottom: 60 },
  seccion: { fontSize: 15, fontWeight: '700', marginTop: 18, marginBottom: 4, color: colors.textOnDark },
  ayuda: { fontSize: 12, color: colors.textMutedOnDark, marginBottom: 10 },
  lista: {
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  filaEmoji: { fontSize: 18 },
  filaTexto: { flex: 1, fontSize: 14, color: colors.textDark, fontWeight: '500' },
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
  avisoBox: {
    marginTop: 24,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  avisoTitulo: { fontWeight: '700', marginBottom: 6, color: colors.warningText },
  avisoTexto: { fontSize: 13, color: colors.warningText, lineHeight: 19 },
  switchFila: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  switchTexto: { fontSize: 13, color: colors.warningText, flexShrink: 1 },
  botonGuardar: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  botonGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderOnDark,
  },
  chipActivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTexto: { color: colors.textMutedOnDark, fontSize: 13, fontWeight: '600' },
  avatares: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  avatarOpcion: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.borderOnDark,
  },
  avatarOpcionActivo: { borderColor: colors.accent, backgroundColor: colors.card },
  avatarEmoji: { fontSize: 22, lineHeight: 28 },
  recoBox: {
    marginTop: 14,
    backgroundColor: colors.card,
    ...sombra,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recoTitulo: { fontSize: 14, fontWeight: '700', color: colors.textDark, marginBottom: 2 },
  recoResumen: { fontSize: 12, color: colors.textMuted, marginBottom: 10, fontStyle: 'italic' },
  recoFila: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  recoBullet: { fontSize: 14, color: colors.accent, lineHeight: 20 },
  recoTexto: { flex: 1, fontSize: 13, color: colors.textDark, lineHeight: 20 },
  recoPie: { fontSize: 11, color: colors.textMuted, marginTop: 8, lineHeight: 16 },
  filaNuevo: { flexDirection: 'row', gap: 8 },
  botonNuevo: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  botonEliminar: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  botonEliminarTexto: { color: colors.dangerText, fontWeight: '600' },
});
