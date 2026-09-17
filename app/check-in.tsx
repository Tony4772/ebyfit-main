import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { BrandMark, PrimaryButton } from "@/components/fitness-ui";
import { AnimatedPressable, Confetti, EntranceView } from "@/components/motion";
import { moodOptions } from "@/constants/fitness";
import { getDateKey, useFitness, type Mood } from "@/lib/fitness-store";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

import { useFeedback } from "@/lib/feedback/sounds";
import { useColors } from "@/hooks/use-colors";

const MOOD_EMOJI: Record<Mood, string> = {
  "Energía alta": "⚡",
  Bien: "🙂",
  Cansado: "😴",
  "Necesito recuperar": "🌙",
};

/** Springy selectable chip used for moods and energy levels. */
function ChoiceChip({ label, selected, onPress, wide = false }: { label: string; selected: boolean; onPress: () => void; wide?: boolean }) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, wide && { flex: 1 }]}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        pressScale={0.9}
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        style={[styles.moodOption, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface }]}
      >
        <Text style={{ color: selected ? colors.background : colors.foreground, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function CheckInScreen() {
  const colors = useColors();
  const { play, haptic, celebrate } = useFeedback();
  const { checkIns, saveCheckIn } = useFitness();
  const existing = checkIns[getDateKey()];
  const [mood, setMood] = useState<Mood>(existing?.mood ?? "Bien");
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (existing) {
      setMood(existing.mood);
      setEnergy(existing.energy);
      setNote(existing.note);
    }
  }, [existing]);

  const handleSave = () => {
    saveCheckIn({ mood, energy, note: note.trim() });
    setSaved(true);
    celebrate();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3200);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5" containerClassName="bg-background">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <EntranceView index={0}>
            <View className="flex-row items-center justify-between">
              <AnimatedPressable
                onPress={() => {
                  play("tap");
                  router.back();
                }}
                accessibilityLabel="Volver"
                accessibilityRole="button"
                pressScale={0.88}
                style={styles.backButton}
              >
                <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
              </AnimatedPressable>
              <BrandMark compact />
              <View className="w-10" />
            </View>
          </EntranceView>

          <EntranceView index={1}>
            <View className="mt-10">
              <Text className="text-[11px] font-bold uppercase tracking-[1.8px] text-primary">Check-in diario</Text>
              <Text className="mt-3 text-[32px] font-black leading-9 tracking-[-1px] text-foreground">Escucha tu ritmo.</Text>
              <Text className="mt-3 text-base leading-6 text-muted">No se trata de entrenar más. Se trata de entrenar mejor para ti.</Text>
            </View>
          </EntranceView>

          <EntranceView index={2}>
            <View className="mt-8">
              <Text className="mb-3 text-base font-extrabold text-foreground">¿Cómo te sientes hoy?</Text>
              <View className="flex-row flex-wrap gap-2">
                {moodOptions.map((option) => (
                  <ChoiceChip
                    key={option}
                    label={`${MOOD_EMOJI[option]}  ${option}`}
                    selected={mood === option}
                    onPress={() => {
                      setMood(option);
                      play("select");
                      haptic();
                    }}
                  />
                ))}
              </View>
            </View>
          </EntranceView>

          <EntranceView index={3}>
            <View className="mt-8">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-extrabold text-foreground">Nivel de energía</Text>
                <Text className="text-sm font-black text-primary">{energy}/5</Text>
              </View>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <ChoiceChip
                    key={value}
                    label={String(value)}
                    selected={value <= energy}
                    wide
                    onPress={() => {
                      setEnergy(value);
                      play(value === 5 ? "success" : "tap");
                      haptic(value === 5 ? Haptics.ImpactFeedbackStyle.Medium : undefined);
                    }}
                  />
                ))}
              </View>
            </View>
          </EntranceView>

          <EntranceView index={4}>
            <View className="mt-8">
              <Text className="mb-3 text-base font-extrabold text-foreground">Una nota para tu yo de mañana</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="¿Qué necesitas cuidar hoy?"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={240}
                textAlignVertical="top"
                style={[styles.noteInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              />
              <Text className="mt-2 text-right text-[11px] font-semibold text-muted">{note.length}/240</Text>
            </View>
          </EntranceView>

          {saved && (
            <View className="mt-5 flex-row items-center rounded-2xl border border-success bg-aqua px-4 py-3">
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text className="ml-2 text-sm font-bold text-foreground">Check-in guardado. Gracias por escucharte.</Text>
            </View>
          )}

          <EntranceView index={5}>
            <View className="mt-8">
              <PrimaryButton onPress={handleSave} icon="checkmark.circle.fill" sound="success">
                Guardar check-in
              </PrimaryButton>
            </View>
            <Text className="mt-6 text-center text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">Tus registros se guardan de forma privada en este dispositivo.</Text>
          </EntranceView>
        </ScrollView>
      </KeyboardAvoidingView>
      {showConfetti && <Confetti active />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 28 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#29332B",
  },
  moodOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noteInput: {
    minHeight: 128,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
  },
});
