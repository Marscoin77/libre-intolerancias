import { useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './Texto';
import type { Producto } from '../data/productos';
import { emojiProducto, tinteProducto } from '../lib/imagenProducto';
import { radius } from '../theme';

/**
 * Foto real si el producto la tiene (Open Food Facts); si no, ilustración con emoji y color de
 * categoría. Usa expo-image con caché en memoria+disco y un fundido suave al aparecer.
 */
export default function FotoProducto({
  producto,
  tamano,
  style,
}: {
  producto: Producto;
  tamano: number | '100%';
  style?: StyleProp<ViewStyle>;
}) {
  const [fallo, setFallo] = useState(false);
  const alto = tamano === '100%' ? 150 : tamano;
  const ancho = tamano;
  const conFoto = Boolean(producto.imagen) && !fallo;

  return (
    <View
      style={[
        styles.caja,
        { width: ancho, height: alto, backgroundColor: conFoto ? '#fff' : tinteProducto(producto.categoria) },
        style,
      ]}
    >
      {conFoto ? (
        <Image
          source={producto.imagen}
          style={styles.imagen}
          contentFit="contain"
          transition={220}
          cachePolicy="memory-disk"
          onError={() => setFallo(true)}
        />
      ) : (
        <Text style={{ fontSize: typeof tamano === 'number' ? tamano * 0.5 : 64 }}>{emojiProducto(producto)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imagen: { width: '100%', height: '100%' },
});
