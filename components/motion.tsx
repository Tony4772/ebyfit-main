import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps, type StyleProp, type TextProps, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";

const SPRING_CONFIG = { damping: 18, stiffness: 260, mass: 0.7 };

type AnimatedPressableProps = PressableProps & {
  children?: ReactNode;
  /** Extra scale-down on press. Default 0.96. */
  pressScale?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable with springy press feedback (scale + opacity).
 * Drop-in replacement for Pressable on interactive cards and buttons.
 */
export function AnimatedPressable({ children, pressScale = 0.96, style, onPressIn, onPressOut, ...props }: AnimatedPressableProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - pressScale) }],
    opacity: 1 - pressed.value * 0.12,
  }));

  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        pressed.value = withSpring(1, SPRING_CONFIG);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(0, SPRING_CONFIG);
        onPressOut?.(event);
      }}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

type EntranceViewProps = {
  children: ReactNode;
  /** Stagger index — each unit adds 70ms of delay. */
  index?: number;
  /** Rise distance in px. Default 18. */
  distance?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fades + rises content in on mount, with optional stagger.
 * Wrap sections of a screen and pass increasing `index` for a cascade.
 */
export function EntranceView({ children, index = 0, distance = 18, className, style }: EntranceViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 70, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [index, distance, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} className={className} pointerEvents="box-none">
      {children}
    </Animated.View>
  );
}

type AnimatedProgressBarProps = {
  /** Target 0–100. */
  progress: number;
  height?: number;
  className?: string;
  fillColor?: string;
  trackColor?: string;
};

/** Progress bar that springs to its value and glows subtly on change. */
export function AnimatedProgressBar({ progress, height = 8, fillColor, trackColor, className }: AnimatedProgressBarProps) {
  const colors = useColors();
  const clamped = Math.min(100, Math.max(0, progress));
  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View className={className} style={[{ height, borderRadius: height / 2, overflow: "hidden", backgroundColor: trackColor ?? colors.border }]}>
      <Animated.View style={[animatedStyle, { height: "100%", borderRadius: height / 2, backgroundColor: fillColor ?? colors.primary }]} />
    </View>
  );
}

type CountUpTextProps = TextProps & {
  /** Final numeric value. */
  value: number;
  duration?: number;
  /** Fractional digits to render. */
  decimals?: number;
  /** Called once per finished count (used to fire a tick sound). */
  onTick?: () => void;
};

/**
 * Animates a number from its previous value to the new one.
 * Fires `onTick` a few times during the run for a subtle counter sound.
 */
export function CountUpText({ value, duration = 850, decimals = 0, onTick, children, ...props }: CountUpTextProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = Date.now();
    let lastTickBucket = -1;

    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      const bucket = Math.floor(t * 4);
      if (bucket > lastTickBucket && t > 0.05 && t < 0.9) {
        lastTickBucket = bucket;
        onTick?.();
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = display.toFixed(decimals);

  return (
    <Text {...props}>
      {formatted}
      {children}
    </Text>
  );
}

type ConfettiProps = {
  /** Mount with `true` to fire; unmount (or toggle) to clear. */
  active: boolean;
  /** Number of pieces. Default 26. */
  count?: number;
};

const CONFETTI_COLORS = ["#9CFE00", "#4DDF8C", "#FFB15C", "#FF7777", "#B59BFF", "#F5F7F4"];

/**
 * Celebration confetti burst. Render it overlaying the screen:
 * `{showConfetti && <Confetti active />}` — it ignores touches by itself.
 */
export function Confetti({ active, count = 26 }: ConfettiProps) {
  const colors = useColors();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 260,
        duration: 1700 + Math.random() * 1100,
        size: 7 + Math.random() * 7,
        rotate: (Math.random() - 0.5) * 540,
        drift: (Math.random() - 0.5) * 90,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() > 0.6,
      })),
    [count],
  );

  if (!active) return null;

  return (
    <View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, { zIndex: 50 }]}>
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} background={colors.background} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  piece,
  background,
}: {
  piece: { id: number; left: number; delay: number; duration: number; size: number; rotate: number; drift: number; color: string; round: boolean };
  background: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) }));
    return () => {
      cancelAnimation(progress);
    };
  }, [piece, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * 640 },
      { translateX: Math.sin(progress.value * Math.PI) * piece.drift },
      { rotate: `${piece.rotate * progress.value}deg` },
    ],
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          top: -24,
          left: `${piece.left}%`,
          width: piece.size,
          height: piece.size * (piece.round ? 1 : 1.6),
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
          borderWidth: 0.5,
          borderColor: background,
        },
      ]}
    />
  );
}

type PulseRingProps = {
  /** Diameter of the pulsing ring. */
  size?: number;
  color?: string;
  /** Render the pulse; turn off to save frames. */
  active?: boolean;
};

/**
 * Attention-grabbing halo that breathes behind a CTA.
 * Place inside a relatively positioned parent, centered on the button.
 */
export function PulseRing({ size = 64, color, active = true }: PulseRingProps) {
  const colors = useColors();
  const ringColor = color ?? colors.primary;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (!active) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 0;
      return;
    }
    const loop = (reverse: number) =>
      withSequence(
        withTiming(reverse, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      );
    scale.value = withRepeat(loop(1.35), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.35, { duration: 300 }), withTiming(0, { duration: 1200 })), -1, false);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [active, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animatedStyle,
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: ringColor,
        },
      ]}
    />
  );
}
