import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppShellStore } from "../../stores/appShellStore";
import { colors, radius, withAlpha } from "../../theme/tokens";

interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({
  width = "100%",
  height,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const reducedMotion = useAppShellStore((state) => state.preferences.reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      shimmer.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [reducedMotion, shimmer]);

  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-180, 260],
      }),
    [shimmer],
  );

  return (
    <View style={[styles.base, { width, height, borderRadius }, style]}>
      {reducedMotion ? null : (
        <Animated.View style={[styles.shimmerWrap, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={[withAlpha("surface2", 0), withAlpha("surface3", 0.9), withAlpha("surface2", 0)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  shimmerWrap: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
  },
  shimmer: {
    flex: 1,
  },
});
