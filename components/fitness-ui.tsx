import { ReactNode, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing as ReEasing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from "react-native-svg";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { AnimatedPressable } from "@/components/motion";
import { useFeedback } from "@/lib/feedback/sounds";
import { useColors } from "@/hooks/use-colors";

type Tone = "primary" | "aqua" | "orange" | "lilac";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary">
        <Text className="text-base font-black text-background">E</Text>
      </View>
      <View>
        <Text className="text-base font-black tracking-[2px] text-foreground">EBYFIT</Text>
        {!compact && <Text className="text-[10px] font-medium tracking-[1.4px] text-muted">MOVE WITH INTENT</Text>}
      </View>
      {!compact && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 10, marginLeft: 2 }} />}
    </View>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <View className="mb-3 flex-row items-end justify-between">
      <View className="flex-1">
        {eyebrow && <Text className="mb-1 text-[11px] font-bold uppercase tracking-[1.8px] text-primary">{eyebrow}</Text>}
        <Text className="text-xl font-extrabold tracking-[-0.4px] text-foreground">{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Pill({ label, tone = "primary" }: { label: string; tone?: Tone }) {
  return (
    <View className={`rounded-full px-3 py-1 ${tone === "primary" ? "bg-primary" : tone === "aqua" ? "bg-aqua" : tone === "orange" ? "bg-orange" : "bg-lilac"}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-[1px] ${tone === "primary" ? "text-background" : "text-foreground"}`}>{label}</Text>
    </View>
  );
}

export function GradientPill({ label }: { label: string }) {
  return (
    <View style={styles.gradientPill}>
      <Svg width={92} height={24} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="pillGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9CFE00" />
            <Stop offset="1" stopColor="#3ED47A" />
          </SvgGradient>
        </Defs>
        <Rect width={92} height={24} rx={12} />
      </Svg>
      <Text className="text-[10px] font-bold uppercase tracking-[1px] text-background">{label}</Text>
    </View>
  );
}

type PrimaryButtonProps = {
  children: ReactNode;
  onPress: () => void;
  icon?: "chevron.right" | "checkmark.circle.fill" | "plus" | "play.fill" | "person.crop.circle";
  variant?: "primary" | "dark" | "outline" | "ghost";
  /** Plays the matching SFX (tap by default). Pass null to stay silent. */
  sound?: "tap" | "select" | "toggle" | "success" | null;
};

export function PrimaryButton({ children, onPress, icon, variant = "primary", sound = "tap" }: PrimaryButtonProps) {
  const colors = useColors();
  const { play, haptic } = useFeedback();
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";
  const backgroundColor = isPrimary ? colors.primary : isOutline || isGhost ? "transparent" : colors.foreground;
  const textColor = isPrimary ? colors.background : colors.foreground;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      pressScale={0.95}
      onPressIn={() => haptic()}
      onPress={() => {
        if (sound) play(sound);
        onPress();
      }}
      style={[styles.button, { backgroundColor, borderColor: isOutline ? colors.border : "transparent" }, isGhost && { borderWidth: 0 }]}
    >
      <Text style={[styles.buttonLabel, { color: textColor }]}>{children}</Text>
      {icon && <IconSymbol name={icon} size={18} color={textColor} />}
    </AnimatedPressable>
  );
}

/** Gradient CTA used in the hero card — sounds, haptic and scale feedback included. */
export function GradientCTA({ label, onPress, icon = "play.fill" }: { label: string; onPress: () => void; icon?: PrimaryButtonProps["icon"] }) {
  const colors = useColors();
  const { play, haptic } = useFeedback();
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1100, easing: ReEasing.inOut(ReEasing.ease) }), withTiming(0.35, { duration: 1100, easing: ReEasing.inOut(ReEasing.ease) })),
      -1,
      false,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + glow.value * 0.3 }));

  return (
    <View>
      <Animated.View pointerEvents="none" style={[glowStyle, { position: "absolute", top: -6, left: -6, right: -6, bottom: -6, borderRadius: 22, backgroundColor: colors.primary }]} />
      <AnimatedPressable
        accessibilityRole="button"
        pressScale={0.94}
        onPressIn={() => haptic()}
        onPress={() => {
          play("select");
          onPress();
        }}
        style={styles.cta}
      >
        <View style={[StyleSheet.absoluteFill, styles.ctaOverflow]}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <SvgGradient id="ctaGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#9CFE00" />
                <Stop offset="1" stopColor="#2FD4A6" />
              </SvgGradient>
            </Defs>
            <Rect width="100%" height="100%" />
          </Svg>
        </View>
        <Text style={[styles.buttonLabel, styles.ctaLabel]}>{label}</Text>
        {icon && <IconSymbol name={icon} size={18} color={colors.background} />}
      </AnimatedPressable>
    </View>
  );
}

/** Standard metric card, no interactions. */
export function MetricTile({ label, value, detail, tone = "primary" }: { label: string; value: string; detail: string; tone?: Tone }) {
  const colors = useColors();
  const accent = tone === "primary" ? colors.primary : tone === "aqua" ? colors.success : tone === "orange" ? colors.warning : "#B59BFF";
  return (
    <View className="min-w-[30%] flex-1 rounded-2xl border border-border bg-surface p-3">
      <View className="mb-3 h-1.5 w-7 rounded-full" style={{ backgroundColor: accent }} />
      <Text className="text-2xl font-extrabold text-foreground">{value}</Text>
      <Text className="mt-1 text-[11px] font-semibold leading-4 text-muted">{label}</Text>
      <Text className="mt-2 text-[10px] font-bold uppercase tracking-[0.6px]" style={{ color: accent }}>{detail}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const colors = useColors();
  return (
    <View className="rounded-2xl border border-dashed border-border bg-surface px-5 py-6">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-aqua">
        <IconSymbol name="bolt.fill" size={20} color={colors.primary} />
      </View>
      <Text className="text-base font-bold text-foreground">{title}</Text>
      <Text className="mt-1 text-sm leading-5 text-muted">{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  cta: {
    minHeight: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    overflow: "visible",
  },
  ctaOverflow: {
    borderRadius: 17,
    overflow: "hidden",
  },
  ctaLabel: {
    color: "#0B0F0D",
  },
  gradientPill: {
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
