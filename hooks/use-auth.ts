import { onIdTokenChanged, signOut, type AuthError, type User as FirebaseUser } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import * as LegacyAuth from "@/lib/_core/auth";

/** Shape used across the app's screens. */
export type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
};

function mapUser(firebaseUser: FirebaseUser): AppUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "Atleta",
  };
}

/** Friendly Spanish messages for the most common Firebase auth error codes. */
function friendlyErrorMessage(error: unknown): string {
  const code = (error as AuthError)?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "Ese correo ya tiene una cuenta. Inicia sesión.";
    case "auth/invalid-email":
      return "El correo no tiene un formato válido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
    default:
      return "No pudimos completar la operación. Inténtalo de nuevo.";
  }
}

type UseAuthOptions = {
  autoFetch?: boolean;
};

/**
 * Firebase-backed auth hook with the same public interface the screens
 * already consume ({ user, isAuthenticated, logout }). Subscribes to
 * onIdTokenChanged so the session survives reloads via AsyncStorage.
 */
export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      // Firebase not configured: app stays in local-only mode.
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser ? mapUser(firebaseUser) : null);
        setError(null);
        setLoading(false);
      },
      (authError) => {
        setError(authError);
        setUser(null);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [autoFetch]);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signOut(auth);
      await LegacyAuth.clearUserInfo();
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    /** Firebase is configured AND the user has a session. */
    firebaseReady: isFirebaseConfigured(),
    refresh: () => undefined,
    logout,
  };
}

export { friendlyErrorMessage };
