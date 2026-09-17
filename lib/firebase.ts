import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
// getReactNativePersistence exists in the React Native bundle of the Firebase SDK
// (Metro resolves it via the package's "react-native" export condition) but the
// web type declarations omit it, so the import needs an ignore for tsc.
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Firebase configuration for EBYFIT.
 *
 * All values come from EXPO_PUBLIC_* environment variables so no secret is
 * committed to the repo. Copy `.env.example` to `.env.local` and fill it with
 * the values from the Firebase console (Project settings → General →
 * Your apps → Web app → SDK setup and configuration).
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** True only when every required Firebase variable is present. */
export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every((value) => value.length > 0);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Lazily initializes and returns the Firebase Auth instance, or null when the
 * environment variables are missing. Safe to call on every render — the app
 * and auth singletons are memoized. Persistence uses AsyncStorage on native
 * and web (React Native build of the Firebase SDK).
 */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (auth) return auth;

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // initializeAuth throws if auth was already initialized (e.g. hot reload).
    auth = getAuth(app);
  }
  return auth;
}

/** Fresh Firebase ID token for authenticating API calls, or null when signed out. */
export async function getCurrentIdToken(): Promise<string | null> {
  const instance = getFirebaseAuth();
  if (!instance?.currentUser) return null;
  try {
    return await instance.currentUser.getIdToken();
  } catch {
    return null;
  }
}
