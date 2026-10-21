import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, sombra } from '../theme';

/** Bloque gris que late suavemente mientras cargan los datos. */
export function Skeleton({
  width,
  height,
  radio = radius.sm,
  style,
}: {
  width?: number | string;
  height?: number;
  radio?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useMemo(() => new Animated.Value(0.5), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  return (
    <Animated.View
      style={[
        { width: width as ViewStyle['width'], height, borderRadius: radio, backgroundColor: colors.surface2, opacity: v },
        style,
      ]}
    />
  );
}

/** Marcador de posición con la misma silueta que ProductCard, para listas que cargan. */
export function SkeletonProductCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={72} height={72} radio={radius.md} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="50%" height={11} />
        <Skeleton width={96} height={22} radio={radius.pill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    gap: 14,
    ...sombra,
  },
});
