import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useFeedback } from "@/lib/feedback/sounds";

const SPRING = { damping: 16, stiffness: 300 };

export function HapticTab(props: BottomTabBarButtonProps) {
  const { play, haptic } = useFeedback();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <PlatformPressable
        {...props}
        style={[props.style, { flex: 1 }]}
        onPressIn={(ev) => {
          scale.value = withSpring(0.88, SPRING);
          haptic(Haptics.ImpactFeedbackStyle.Medium);
          play("tap");
          props.onPressIn?.(ev);
        }}
        onPressOut={(ev) => {
          scale.value = withSpring(1, SPRING);
          props.onPressOut?.(ev);
        }}
      />
    </Animated.View>
  );
}
