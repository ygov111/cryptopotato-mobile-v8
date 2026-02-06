import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";

/**
 * ShimmerText - Shows a subtle shimmer animation while text is being translated
 * Once translation is ready, it fades in smoothly
 */
export default function ShimmerText({
  children,
  isLoading = false,
  style = {},
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) {
      // Start shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // Stop shimmer and fade in new text
      shimmerAnim.stopAnimation();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View style={{ opacity: isLoading ? shimmerOpacity : fadeAnim }}>
      <Text style={style}>{children}</Text>
    </Animated.View>
  );
}
