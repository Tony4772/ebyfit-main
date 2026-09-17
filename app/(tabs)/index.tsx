import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { BrandMark, GradientCTA, MetricTile, Pill, SectionTitle } from "@/components/fitness-ui";
import { AnimatedPressable, AnimatedProgressBar, Confetti, EntranceView } from "@/components/motion";
import { getDateKey, getWeekDates, useFitness } from "@/lib/fitness-store";
import { workouts, weekLabels } from "@/constants/fitness";
import { ScreenContainer } from "@/components/screen-container";
import { useFeedback } from "@/lib/feedback/sounds";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

function formatToday() {
  return new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

export default function HomeScreen() {
  const colors = useColors();
  const { play, haptic, celebrate } = useFeedback();
  const { user } = useAuth({ autoFetch: false });
  const { checkIns, weeklySessions, streak, isWorkoutComplete, workoutLogs } = useFitness();
  const todayKey = getDateKey();
  const featuredWorkout = workouts[0];
  const hasCompletedToday = isWorkoutComplete(featuredWorkout.id);
  const weekDates = useMemo(() => getWeekDates(), []);
  const firstName = user?.name?.split(" ")[0] ?? "Atleta";
  const weeklyTarget = 4;
  const weeklyProgress = Math.min(100, Math.round((weeklySessions / weeklyTarget) * 100));
  const [celebrated, setCelebrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Celebrate once when the user completes the featured session.
  useEffect(() => {
    if (hasCompletedToday && !celebrated) {
      setCelebrated(true);
      celebrate();
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3400);
      return () => clearTimeout(timer);
    }
    if (!hasCompletedToday) setCelebrated(false);
  }, [celebrate, celebrated, hasCompletedToday]);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EntranceView index={0}>
          <View className="flex-row items-center justify-between">
            <BrandMark />
            <AnimatedPressable
              accessibilityLabel="Abrir perfil"
              accessibilityRole="button"
              pressScale={0.9}
              onPressIn={() => haptic()}
              onPress={() => {
                play("tap");
                router.push("/(tabs)/profile");
              }}
              style={[styles.avatarButton, { backgroundColor: colors.surface }]}
            >
              <Text className="text-sm font-extrabold text-primary">{firstName.slice(0, 1).toUpperCase()}</Text>
            </AnimatedPressable>
          </View>
        </EntranceView>

        <EntranceView index={1}>
          <View className="mt-8">
            <Text className="text-sm font-semibold capitalize text-muted">{formatToday()}</Text>
            <Text className="mt-2 text-[32px] font-black leading-9 tracking-[-1px] text-foreground">Hola, {firstName}.</Text>
            <Text className="mt-2 max-w-[310px] text-base leading-6 text-muted">Tu energía se construye con una decisión a la vez.</Text>
          </View>
        </EntranceView>

        <EntranceView index={2}>
          <View className="mt-6 overflow-hidden rounded-[26px] bg-foreground p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Pill label="Sesión recomendada" />
                <Text className="mt-4 text-2xl font-black leading-7 text-background">{featuredWorkout.title}</Text>
                <Text className="mt-2 text-sm leading-5 text-muted">{featuredWorkout.duration} · {featuredWorkout.exercises.length} ejercicios · {featuredWorkout.level}</Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                <IconSymbol name="figure.strengthtraining.traditional" size={25} color={colors.background} />
              </View>
            </View>
            <View className="mt-5 flex-row items-center gap-3">
              <View className="flex-1">
                <GradientCTA label="Ver mi plan" icon="chevron.right" onPress={() => router.push("/plan")} />
              </View>
              <View className="rounded-2xl border border-muted/30 px-3 py-3">
                <Text className="text-[10px] font-bold uppercase tracking-[1px] text-muted">Hoy</Text>
                <Text className="mt-1 text-center text-sm font-black text-background">{hasCompletedToday ? "Listo" : "32′"}</Text>
              </View>
            </View>
          </View>
        </EntranceView>

        <EntranceView index={3}>
          <View className="mt-7">
            <SectionTitle eyebrow="Tu semana" title="Mantén el ritmo" action={<Text className="text-sm font-bold text-primary">{weeklyProgress}%</Text>} />
            <View className="rounded-2xl border border-border bg-surface p-4">
              <AnimatedProgressBar progress={weeklyProgress} className="mb-4" />
              <View className="flex-row justify-between">
                {weekDates.map((date, index) => {
                  const completed = workoutLogs.some((log) => log.date === getDateKey(date));
                  const isToday = getDateKey(date) === todayKey;
                  return (
                    <View key={getDateKey(date)} className="items-center gap-2">
                      <Text className="text-[11px] font-bold text-muted">{weekLabels[index]}</Text>
                      <View className={`h-8 w-8 items-center justify-center rounded-full ${completed ? "bg-primary" : isToday ? "border-2 border-primary" : "bg-background"}`}>
                        {completed ? <IconSymbol name="checkmark.circle.fill" size={16} color={colors.background} /> : <Text className="text-[11px] font-bold text-muted">{date.getDate()}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </EntranceView>

        <EntranceView index={4}>
          <View className="mt-6 flex-row gap-3">
            <MetricTile label="Sesiones esta semana" value={`${weeklySessions}/${weeklyTarget}`} detail="Objetivo semanal" tone="primary" />
            <MetricTile label="Racha actual" value={`${streak}d`} detail="Sigue así" tone="orange" />
          </View>
        </EntranceView>

        <EntranceView index={5}>
          <View className="mt-7">
            <SectionTitle eyebrow="Check-in" title="¿Cómo llegas hoy?" action={<Text className="text-xs font-semibold text-muted">2 min</Text>} />
            <AnimatedPressable
              accessibilityRole="button"
              pressScale={0.97}
              onPressIn={() => haptic()}
              onPress={() => {
                play("select");
                router.push("/check-in");
              }}
              style={[styles.checkInCard, { backgroundColor: colors.aqua, borderColor: colors.border }]}
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-extrabold text-foreground">{checkIns[todayKey] ? "Check-in completado" : "Registra cómo te sientes"}</Text>
                <Text className="mt-1 text-sm leading-5 text-muted">{checkIns[todayKey] ? "Tu registro ayuda a ajustar tu ritmo." : "Energía, ánimo y una nota rápida."}</Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                <IconSymbol name={checkIns[todayKey] ? "checkmark.circle.fill" : "plus"} size={19} color={colors.background} />
              </View>
            </AnimatedPressable>
          </View>
        </EntranceView>

        <Text className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">© 2026 EBYZOM E.I.R.L. · EBYFIT v1.0</Text>
      </ScrollView>
      {showConfetti && <Confetti active />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#29332B",
  },
  checkInCard: {
    minHeight: 84,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
});
