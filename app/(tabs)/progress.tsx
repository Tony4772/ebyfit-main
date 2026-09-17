import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { MetricTile, PrimaryButton, SectionTitle } from "@/components/fitness-ui";
import { ScreenContainer } from "@/components/screen-container";
import { CountUpText, EntranceView } from "@/components/motion";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getDateKey, getWeekDates, useFitness } from "@/lib/fitness-store";
import { weekLabels } from "@/constants/fitness";
import { useFeedback } from "@/lib/feedback/sounds";
import { useColors } from "@/hooks/use-colors";

/** Weekly activity bar that springs up to height when a session is logged. */
function WeekBar({ completed, delay, accent, track }: { completed: boolean; delay: number; accent: string; track: string }) {
  const height = useSharedValue(10);

  useEffect(() => {
    height.value = 10;
    if (completed) {
      height.value = withDelay(delay, withTiming(64, { duration: 700, easing: Easing.out(Easing.back(1.4)) }));
    }
  }, [completed, delay, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.bar, animatedStyle, { backgroundColor: completed ? accent : track }]} />;
}

export default function ProgressScreen() {
  const colors = useColors();
  const { play } = useFeedback();
  const { workoutLogs, weeklySessions, streak, weightEntries, addWeight, isWorkoutComplete } = useFitness();
  const [weight, setWeight] = useState("");
  const [saved, setSaved] = useState(false);
  const weekDates = useMemo(() => getWeekDates(), []);
  const latestWeight = weightEntries[0]?.value;
  const previousWeight = weightEntries[1]?.value;
  const weightDelta = latestWeight !== undefined && previousWeight !== undefined ? latestWeight - previousWeight : null;
  const monthSessions = workoutLogs.filter((log) => log.date.slice(0, 7) === getDateKey().slice(0, 7)).length;

  const saveWeight = () => {
    const normalized = Number(weight.replace(",", "."));
    if (!Number.isFinite(normalized) || normalized <= 0 || normalized > 500) return;
    addWeight(normalized);
    setWeight("");
    setSaved(true);
    play("success");
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EntranceView index={0}>
          <Text className="text-sm font-semibold text-muted">Tu evolución</Text>
          <Text className="mt-2 text-[32px] font-black leading-9 tracking-[-1px] text-foreground">Mira lo que estás construyendo.</Text>
          <Text className="mt-2 text-base leading-6 text-muted">Los datos pequeños también cuentan. Registra, observa y ajusta.</Text>
        </EntranceView>

        <EntranceView index={1}>
          <View className="mt-7 flex-row gap-3">
            <MetricTile label="Sesiones totales" value={`${workoutLogs.length}`} detail="Desde que empezaste" tone="primary" />
            <MetricTile label="Racha actual" value={`${streak}d`} detail="Días consecutivos" tone="orange" />
          </View>
          <View className="mt-4 flex-row gap-3">
            <MetricTile label="Este mes" value={`${monthSessions}`} detail="Sesiones" tone="aqua" />
            <MetricTile label="Peso actual" value={latestWeight !== undefined ? `${latestWeight} kg` : "—"} detail={weightDelta === null ? "Sin comparación" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`} tone="lilac" />
          </View>
        </EntranceView>

        <EntranceView index={2}>
          <View className="mt-7">
            <SectionTitle eyebrow="Actividad" title="Tu semana en movimiento" />
            <View className="rounded-2xl border border-border bg-surface p-5">
              <View className="h-28 flex-row items-end justify-between">
                {weekDates.map((date, index) => {
                  const completed = isWorkoutComplete("full-body-foundation", date) || workoutLogs.some((log) => log.date === getDateKey(date));
                  return (
                    <View key={getDateKey(date)} className="items-center gap-2">
                      <View className="h-20 w-7 items-center justify-end rounded-full bg-background">
                        <WeekBar completed={completed} delay={index * 90} accent={colors.primary} track={colors.border} />
                      </View>
                      <Text className="text-[11px] font-bold text-muted">{weekLabels[index]}</Text>
                    </View>
                  );
                })}
              </View>
              <View className="mt-5 flex-row items-center justify-between border-t border-border pt-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <Text className="text-xs font-semibold text-muted">Sesión completada</Text>
                </View>
                <CountUpText value={weeklySessions} onTick={() => play("counter")} className="text-sm font-black text-foreground">{" esta semana"}</CountUpText>
              </View>
            </View>
          </View>
        </EntranceView>

        <EntranceView index={3}>
          <View className="mt-7">
            <SectionTitle eyebrow="Registro corporal" title="Peso y tendencias" />
            <View className="rounded-2xl border border-border bg-surface p-5">
              <Text className="text-sm leading-5 text-muted">Añade tu peso cuando tenga sentido para ti. El progreso no es una sola cifra.</Text>
              <View className="mt-4 flex-row gap-3">
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Ej. 72.5"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  style={[styles.weightInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <View className="flex-1">
                  <PrimaryButton onPress={saveWeight} icon="plus">Añadir registro</PrimaryButton>
                </View>
              </View>
              {saved && (
                <View className="mt-4 flex-row items-center">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  <Text className="ml-2 text-xs font-bold text-success">Registro guardado</Text>
                </View>
              )}
              {weightEntries.length > 0 && (
                <View className="mt-5 border-t border-border pt-4">
                  <Text className="text-[11px] font-bold uppercase tracking-[1px] text-muted">Últimos registros</Text>
                  {weightEntries.slice(0, 3).map((entry) => (
                    <View key={entry.id} className="mt-3 flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-foreground">{new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(`${entry.date}T12:00:00`))}</Text>
                      <Text className="text-sm font-black text-foreground">{entry.value} kg</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </EntranceView>

        <Text className="mt-7 text-center text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">Progreso privado · Diseñado por EBYZOM E.I.R.L.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 32 },
  bar: { width: 19, borderRadius: 12 },
  weightInput: {
    width: 120,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "700",
  },
});
