import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { workouts, type Workout } from "@/constants/fitness";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pill, PrimaryButton, SectionTitle } from "@/components/fitness-ui";
import { AnimatedPressable, Confetti, EntranceView } from "@/components/motion";
import { useFeedback } from "@/lib/feedback/sounds";
import { useFitness } from "@/lib/fitness-store";
import { useColors } from "@/hooks/use-colors";

function WorkoutCard({ workout, expanded, onToggleExpand, onToggleComplete }: { workout: Workout; expanded: boolean; onToggleExpand: () => void; onToggleComplete: () => void }) {
  const colors = useColors();
  const { play, haptic, celebrate } = useFeedback();
  const { isWorkoutComplete } = useFitness();
  const completed = isWorkoutComplete(workout.id);
  const tone = workout.accent === "aqua" ? "aqua" : workout.accent === "orange" ? "orange" : "primary";
  const wasCompleted = useRef(completed);

  // Fire celebration the moment a session gets marked complete.
  useEffect(() => {
    if (completed && !wasCompleted.current) {
      wasCompleted.current = true;
      celebrate();
    }
    if (!completed) wasCompleted.current = false;
  }, [celebrate, completed]);

  const toggleExpand = () => {
    onToggleExpand();
  };

  return (
    <View className="mb-4 overflow-hidden rounded-[24px] border border-border bg-surface">
      <Image source={workout.image} style={styles.workoutImage} contentFit="cover" transition={180} />
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Pill label={workout.category} tone={tone} />
          <Text className="text-xs font-bold text-muted">{workout.duration}</Text>
        </View>
        <Text className="mt-3 text-xl font-black text-foreground">{workout.title}</Text>
        <Text className="mt-1 text-sm text-muted">{workout.level} · Técnica, control y consistencia.</Text>

        <AnimatedPressable
          accessibilityRole="button"
          pressScale={0.97}
          onPressIn={() => haptic()}
          onPress={() => {
            play("toggle");
            toggleExpand();
          }}
          style={styles.detailButton}
        >
          <Text className="text-xs font-bold uppercase tracking-[0.8px] text-primary">{expanded ? "Ocultar ejercicios" : "Ver ejercicios"}</Text>
          <IconSymbol name={expanded ? "chevron.left" : "chevron.right"} size={16} color={colors.primary} />
        </AnimatedPressable>

        {expanded && (
          <Animated.View entering={FadeInDown.duration(260)} className="mt-3 rounded-2xl bg-background p-3">
            {workout.exercises.map((exercise, index) => (
              <View key={exercise} className="flex-row items-center border-b border-border py-2 last:border-b-0">
                <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-aqua">
                  <Text className="text-[10px] font-black text-foreground">0{index + 1}</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">{exercise}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <View className="mt-4">
          <PrimaryButton
            onPress={onToggleComplete}
            icon={completed ? "checkmark.circle.fill" : "play.fill"}
            variant={completed ? "outline" : "primary"}
            sound={completed ? "toggle" : "success"}
          >
            {completed ? "Completado hoy" : "Marcar como completado"}
          </PrimaryButton>
        </View>
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(workouts[0]?.id ?? null);
  const { toggleWorkout, workoutLogs } = useFitness();
  const [showConfetti, setShowConfetti] = useState(false);

  // Listen for any completion to throw confetti over the list.
  const logsKey = workoutLogs.length;
  const prevLogs = useRef(logsKey);
  useEffect(() => {
    if (logsKey > prevLogs.current) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3400);
      prevLogs.current = logsKey;
      return () => clearTimeout(timer);
    }
    prevLogs.current = logsKey;
  }, [logsKey]);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <EntranceView index={0}>
            <Text className="text-sm font-semibold text-muted">Plan de entrenamiento</Text>
            <Text className="mt-2 text-[32px] font-black leading-9 tracking-[-1px] text-foreground">Entrena con intención.</Text>
            <Text className="mt-2 mb-6 text-base leading-6 text-muted">Sesiones pensadas para que avances sin perder de vista cómo te sientes.</Text>
            <SectionTitle eyebrow="Para esta semana" title="Tu biblioteca" action={<Text className="text-xs font-bold text-muted">{workouts.length} sesiones</Text>} />
          </EntranceView>
        }
        renderItem={({ item, index }) => (
          <EntranceView index={index + 1}>
            <WorkoutCard
              workout={item}
              expanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              onToggleComplete={() => toggleWorkout(item.id)}
            />
          </EntranceView>
        )}
        ListFooterComponent={<Text className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">Contenido de entrenamiento · EBYFIT / EBYZOM E.I.R.L.</Text>}
      />
      {showConfetti && <Confetti active />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  workoutImage: {
    width: "100%",
    height: 172,
  },
  detailButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
});
