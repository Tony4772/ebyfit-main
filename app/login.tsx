import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BrandMark, PrimaryButton } from "@/components/fitness-ui";
import { EntranceView } from "@/components/motion";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { useFeedback } from "@/lib/feedback/sounds";
import { getFirebaseAuth } from "@/lib/firebase";
import { friendlyErrorMessage } from "@/hooks/use-auth";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { play, haptic } = useFeedback();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  const switchMode = () => {
    haptic();
    play("toggle");
    setError(null);
    setMode(isSignup ? "signin" : "signup");
  };

  const submit = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase no está configurado en esta instalación.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Escribe tu correo y contraseña.");
      return;
    }
    if (isSignup && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const displayName = name.trim();
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      haptic(Haptics.ImpactFeedbackStyle.Medium);
      play("success");
      router.replace("/(tabs)/profile");
    } catch (err) {
      haptic(Haptics.NotificationFeedbackType.Error);
      setError(friendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <EntranceView index={0}>
            <BrandMark />
          </EntranceView>

          <EntranceView index={1}>
            <Text className="mt-10 text-3xl font-black tracking-[-0.5px] text-foreground">
              {isSignup ? "Crea tu cuenta" : "Bienvenido de vuelta"}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              {isSignup
                ? "Tu progreso queda en este dispositivo y se sincroniza al conectar tu cuenta."
                : "Inicia sesión para sincronizar tu progreso entre dispositivos."}
            </Text>
          </EntranceView>

          <EntranceView index={2}>
            <View className="mt-8 gap-3">
              {isSignup && (
                <View>
                  <Text className="mb-1 text-xs font-bold uppercase tracking-[1px] text-muted">Nombre</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Atleta EBYFIT"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>
              )}
              <View>
                <Text className="mb-1 text-xs font-bold uppercase tracking-[1px] text-muted">Correo</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
              <View>
                <Text className="mb-1 text-xs font-bold uppercase tracking-[1px] text-muted">Contraseña</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            </View>
          </EntranceView>

          {error && (
            <View
              className="mt-4 rounded-2xl border p-4"
              style={{ backgroundColor: `${colors.error}1A`, borderColor: `${colors.error}66` }}
            >
              <Text className="text-sm font-semibold text-error">{error}</Text>
            </View>
          )}

          <EntranceView index={3}>
            <View className="mt-6">
              <PrimaryButton onPress={submit} sound={null} icon={isSignup ? "plus" : "checkmark.circle.fill"}>
                {busy ? "Un momento…" : isSignup ? "Crear cuenta" : "Iniciar sesión"}
              </PrimaryButton>
              <Pressable
                accessibilityRole="button"
                onPress={switchMode}
                style={({ pressed }) => [styles.switchMode, pressed && styles.pressed]}
              >
                <Text className="text-sm font-semibold text-primary">
                  {isSignup ? "Ya tengo cuenta · Iniciar sesión" : "No tengo cuenta · Crear una"}
                </Text>
              </Pressable>
            </View>
          </EntranceView>

          <EntranceView index={4}>
            <Text className="mt-10 text-center text-[11px] leading-5 text-muted">
              Tus datos de entrenamiento se guardan localmente. La cuenta solo sirve para sincronizarlos.
            </Text>
          </EntranceView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 32 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  switchMode: { marginTop: 18, alignItems: "center", minHeight: 44, justifyContent: "center" },
  pressed: { opacity: 0.7 },
});
