import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

/**
 * Top Banner Notification Component
 * Slides down from top, auto-dismisses after 4 seconds
 * Can be manually dismissed by tapping X or the banner itself
 */
export default function NotificationBanner({
  visible,
  onDismiss,
  title,
  message,
  icon = "🔔",
  type = "default", // "default", "success", "warning", "error"
  onPress,
}) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: insets.top + 10,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      handleDismiss();
    } else {
      handleDismiss();
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "#10b981",
          border: "#059669",
          text: "#FFFFFF",
        };
      case "warning":
        return {
          bg: "#f59e0b",
          border: "#d97706",
          text: "#000000",
        };
      case "error":
        return {
          bg: "#ef4444",
          border: "#dc2626",
          text: "#FFFFFF",
        };
      default:
        return {
          bg: "#fed319",
          border: "#fbbf24",
          text: "#000000",
        };
    }
  };

  const colors = getColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <Pressable
        onPress={handlePress}
        style={{
          backgroundColor: colors.bg,
          borderRadius: 12,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 2,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Icon */}
        <Text style={{ fontSize: 24, marginRight: 12 }}>{icon}</Text>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {title && (
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 2,
              }}
            >
              {title}
            </Text>
          )}
          {message && (
            <Text style={{ color: colors.text, fontSize: 14 }}>{message}</Text>
          )}
        </View>

        {/* Close Button */}
        <Pressable
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: 8 }}
        >
          <X size={20} color={colors.text} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
