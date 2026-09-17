import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { FitnessProvider } from "@/lib/fitness-store";
import { FeedbackProvider } from "@/lib/feedback/sounds";
import { SyncProvider } from "@/lib/sync/sync-provider";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

/** Branded intro overlay: brief, fades out, never blocks longer than ~1.6s. */
function SplashOverlay() {
  const [gone, setGone] = useState(false);
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      850,
      withTiming(0, { duration: 650, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) setGone(true);
      }),
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (gone) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.splash, animatedStyle]}>
      <View style={styles.splashInner}>
        <View style={styles.splashMark}>
          <Text style={styles.splashLetter}>E</Text>
        </View>
        <Text style={styles.splashTitle}>EBYFIT</Text>
        <Text style={styles.splashTagline}>MOVE WITH INTENT</Text>
      </View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SyncProvider>
            <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="oauth/callback" />
          </Stack>
            <StatusBar style="auto" />
          </SyncProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>
            <FeedbackProvider>
              <FitnessProvider>{content}</FitnessProvider>
              <SplashOverlay />
            </FeedbackProvider>
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: "#0B0F0D",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    elevation: 100,
  },
  splashInner: {
    alignItems: "center",
  },
  splashMark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#9CFE00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  splashLetter: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0B0F0D",
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#F5F7F4",
  },
  splashTagline: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 3,
    color: "#9AA69B",
  },
});
