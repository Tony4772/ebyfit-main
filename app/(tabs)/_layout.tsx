import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);
  const tabBarHeight = 64 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          paddingTop: 10,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          marginHorizontal: 14,
          marginBottom: Platform.OS === "web" ? 0 : 8,
          borderRadius: 24,
          backgroundColor: colors.surface,
          borderTopColor: "transparent",
          // Soft elevation without blur dependencies.
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <IconSymbol size={23} name="house.fill" color={color} />
              {focused && <View style={[styles.glowDot, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <IconSymbol size={23} name="figure.strengthtraining.traditional" color={color} />
              {focused && <View style={[styles.glowDot, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progreso",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <IconSymbol size={23} name="chart.bar.fill" color={color} />
              {focused && <View style={[styles.glowDot, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <IconSymbol size={23} name="person.crop.circle.fill" color={color} />
              {focused && <View style={[styles.glowDot, { backgroundColor: colors.primary }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  glowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
