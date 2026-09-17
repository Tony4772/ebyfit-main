import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

import * as Haptics from "expo-haptics";

import { BrandMark, Pill, PrimaryButton, SectionTitle } from "@/components/fitness-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { EntranceView } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useRouter, type Href } from "expo-router";
import { useFeedback } from "@/lib/feedback/sounds";
import { useFitness } from "@/lib/fitness-store";
import { useSync, type SyncStatus } from "@/lib/sync/sync-provider";

/** iOS-style animated switch built on Reanimated. */
function FeedbackSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const colors = useColors();
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(on ? 22 : 0, { duration: 200 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      style={[styles.switchTrack, { backgroundColor: on ? colors.primary : colors.border }]}
    >
      <Animated.View style={[styles.switchKnob, { backgroundColor: on ? colors.background : "#fff" }, knobStyle]} />
    </Pressable>
  );
}

const SYNC_BADGE: Record<SyncStatus, { label: string; tone: "primary" | "aqua" | "orange" }> = {
  idle: { label: "Cuenta local", tone: "aqua" },
  syncing: { label: "Sincronizando…", tone: "aqua" },
  synced: { label: "Sincronizado", tone: "primary" },
  error: { label: "Sin conexión", tone: "orange" },
};

export default function ProfileScreen() {
  const colors = useColors();
  const { user, isAuthenticated, logout, firebaseReady } = useAuth();
  const { totalSessions, checkIns, weightEntries } = useFitness();
  const { status: syncStatus, syncNow } = useSync();
  const router = useRouter();
  const { play, haptic, celebrate, settings, updateSettings } = useFeedback();
  const displayName = user?.name ?? "Atleta EBYFIT";
  const initial = displayName.slice(0, 1).toUpperCase();

  const toggleSound = () => {
    const next = !settings.soundOn;
    updateSettings({ soundOn: next });
    if (next) play("select");
  };

  const toggleHaptics = () => {
    const next = !settings.hapticsOn;
    updateSettings({ hapticsOn: next });
    if (next) haptic(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EntranceView index={0}>
          <BrandMark />
        </EntranceView>

        <EntranceView index={1}>
          <View className="mt-8 flex-row items-center rounded-[24px] border border-border bg-surface p-4">
            <View className="h-16 w-16 items-center justify-center rounded-[21px] bg-primary">
              <Text className="text-2xl font-black text-background">{initial}</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xl font-black text-foreground">{displayName}</Text>
              <Text className="mt-1 text-sm text-muted">{user?.email ?? "Tu espacio personal de movimiento"}</Text>
              <View className="mt-3 flex-row items-center gap-2">
                <Pill
                  label={isAuthenticated ? SYNC_BADGE[syncStatus].label : "Modo local"}
                  tone={isAuthenticated ? SYNC_BADGE[syncStatus].tone : "aqua"}
                />
                {isAuthenticated && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sincronizar ahora"
                    onPress={() => {
                      haptic();
                      play("select");
                      syncNow();
                    }}
                    className="h-8 w-8 items-center justify-center rounded-full border border-border"
                  >
                    <IconSymbol name="arrow.triangle.2.circlepath" size={14} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          {!isAuthenticated && (
            <View className="mt-3">
              {firebaseReady ? (
                <PrimaryButton variant="outline" icon="person.crop.circle" sound="select" onPress={() => router.push("/login" as Href)}>
                  Conectar cuenta para sincronizar
                </PrimaryButton>
              ) : (
                <View className="rounded-2xl border border-border bg-surface p-4">
                  <Text className="text-xs leading-5 text-muted">
                    Sincronización entre dispositivos disponible próximamente. Tus datos quedan guardados en este dispositivo.
                  </Text>
                </View>
              )}
            </View>
          )}
        </EntranceView>

        <EntranceView index={2}>
          <View className="mt-7">
            <SectionTitle eyebrow="Resumen" title="Tu espacio" />
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
                <Text className="text-2xl font-black text-foreground">{totalSessions}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">Sesiones registradas</Text>
              </View>
              <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
                <Text className="text-2xl font-black text-foreground">{Object.keys(checkIns).length}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">Check-ins realizados</Text>
              </View>
              <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
                <Text className="text-2xl font-black text-foreground">{weightEntries.length}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">Registros de peso</Text>
              </View>
            </View>
          </View>
        </EntranceView>

        <EntranceView index={3}>
          <View className="mt-7">
            <SectionTitle eyebrow="Sonido y vibración" title="Sensaciones" action={<Text className="text-[11px] font-semibold text-muted">Toca para probar</Text>} />
            <View className="overflow-hidden rounded-2xl border border-border bg-surface">
              <View className="flex-row items-center border-b border-border p-4">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-aqua">
                  <IconSymbol name="bolt.fill" size={18} color={colors.foreground} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-extrabold text-foreground">Sonidos de la app</Text>
                  <Text className="mt-1 text-xs leading-4 text-muted">Toques, logros y celebraciones.</Text>
                </View>
                <FeedbackSwitch on={settings.soundOn} onToggle={toggleSound} />
              </View>
              <View className="flex-row items-center p-4">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-orange">
                  <IconSymbol name="flame.fill" size={18} color={colors.foreground} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-extrabold text-foreground">Vibración</Text>
                  <Text className="mt-1 text-xs leading-4 text-muted">Respuesta táctil en cada acción.</Text>
                </View>
                <FeedbackSwitch on={settings.hapticsOn} onToggle={toggleHaptics} />
              </View>
            </View>
          </View>
        </EntranceView>

        <EntranceView index={4}>
          <View className="mt-7">
            <SectionTitle eyebrow="Experiencia" title="Diseñado para acompañarte" />
            <View className="overflow-hidden rounded-2xl border border-border bg-surface">
              <View className="flex-row items-center border-b border-border p-4">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-aqua"><IconSymbol name="lock.fill" size={18} color={colors.foreground} /></View>
                <View className="ml-3 flex-1"><Text className="text-sm font-extrabold text-foreground">Privacidad primero</Text><Text className="mt-1 text-xs leading-4 text-muted">Tus registros locales permanecen en tu dispositivo.</Text></View>
              </View>
              <View className="flex-row items-center border-b border-border p-4">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-orange"><IconSymbol name="chart.bar.fill" size={18} color={colors.foreground} /></View>
                <View className="ml-3 flex-1"><Text className="text-sm font-extrabold text-foreground">Progreso sin presión</Text><Text className="mt-1 text-xs leading-4 text-muted">Métricas sencillas para tomar mejores decisiones.</Text></View>
              </View>
              <View className="flex-row items-center p-4">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-lilac"><IconSymbol name="figure.strengthtraining.traditional" size={18} color={colors.foreground} /></View>
                <View className="ml-3 flex-1"><Text className="text-sm font-extrabold text-foreground">Planes ilustrados</Text><Text className="mt-1 text-xs leading-4 text-muted">Entrenamientos claros para avanzar con intención.</Text></View>
              </View>
            </View>
          </View>
        </EntranceView>

        {isAuthenticated && (
          <Pressable onPress={logout} accessibilityRole="button" style={({ pressed }) => [styles.logoutButton, { borderColor: colors.border }, pressed && styles.pressed]}>
            <Text className="text-sm font-bold text-error">Cerrar sesión</Text>
          </Pressable>
        )}

        <EntranceView index={5}>
          <View className="mt-8 items-center rounded-2xl border border-border bg-surface px-5 py-5">
            <Text
              onPress={() => celebrate()}
              className="text-[11px] font-bold uppercase tracking-[1.4px] text-primary"
            >
              EBYZOM E.I.R.L.
            </Text>
            <Text className="mt-2 text-center text-xs leading-5 text-muted">EBYFIT es una aplicación de bienestar y seguimiento personal. No sustituye asesoría médica profesional.</Text>
            <Text className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[1px] text-muted">© 2026 EBYZOM E.I.R.L. Todos los derechos reservados.</Text>
          </View>
        </EntranceView>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 32 },
  logoutButton: { marginTop: 20, minHeight: 48, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: "center",
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
