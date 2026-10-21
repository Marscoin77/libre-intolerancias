import { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

/** Entrada suave: aparece con fundido y un pequeño desplazamiento hacia arriba. */
export default function Aparece({
  children,
  retraso = 0,
  style,
}: {
  children: React.ReactNode;
  retraso?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(valor, { toValue: 1, duration: 320, delay: retraso, useNativeDriver: true }).start();
  }, [valor, retraso]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: valor,
          transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
