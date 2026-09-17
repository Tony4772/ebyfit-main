# EBYFIT — Preview run doc

Static web preview: `expo export --platform web` served by `scripts/serve-static.mjs` on port **4173**.
(A Metro dev server on 8081 also works but is slow to first compile; the static export is the reliable preview path.)

## 1. Reproduce the artifacts

```bash
pnpm install                      # once, if node_modules is missing
EXPO_USE_METRO_WORKSPACE_ROOT=1 EXPO_NO_TELEMETRY=1 CI=1 \
  npx expo export --platform web --output-dir dist-web
```

- `dist-web/` is generated output (safe to delete and regenerate). It is NOT committed.
- Sound assets live in `assets/sounds/*.wav`; if missing, regenerate first:
  `node scripts/generate-sounds.mjs`
- No `.env` files are needed — the app is fully client-side with mocked data.

## 2. Run the server

```bash
# Foreground:
node scripts/serve-static.mjs dist-web 4173

# Windows detached (Freebuff preview recipe) — stdout and stderr MUST go to different files:
powershell -NoProfile -Command "(Start-Process -FilePath 'node.exe' \
  -ArgumentList 'scripts/serve-static.mjs','dist-web','4173' \
  -RedirectStandardOutput '.freebuff/preview.log' \
  -RedirectStandardError  '.freebuff/preview.log.err' \
  -WindowStyle Hidden -PassThru).Id"
```

Then verify: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4173/` → expect `200`.

Notes:
- `scripts/serve-static.mjs <root> <port>` serves static files with an SPA fallback to `index.html`.
- Port 4173 is chosen because Expo's default 8081 is reserved for Metro. If 4173 is busy, pick any free port and pass it as the third argument — no config change needed.
- Known benign console warning on web: React error #418 (hydration mismatch from dark-mode detection differing between server render and client). It recovers immediately on the client and does not affect behavior.

## 3. Firebase login (optional)

The login screen (`/login`) uses **Firebase Auth** (email/password, registration + sign-in).

- Copy `.env.example` to `.env.local` and fill the 6 `EXPO_PUBLIC_FIREBASE_*` values
  from the Firebase console (Project settings → General → Your apps → Web app).
- Values are baked into the bundle at export time: **re-run step 1 after changing them**.
- Without them the app stays in local-only mode: the profile shows a
  "sincronización próximamente" card and the login form reports that Firebase is not
  configured. The legacy Manus OAuth route (`/oauth/callback`) is unused by the UI.
- `lib/firebase.ts` is the single config point; `hooks/use-auth.ts` exposes
  `{ user, isAuthenticated, logout, firebaseReady }`; `lib/sync/sync-provider.tsx`
  reconciles local data with the tRPC server when a session exists.
- In Firebase console enable Authentication → Sign-in method → Email/Password.

## 4. Android nativo (Kotlin + Jetpack Compose)

Proyecto Gradle completo en `android/` — se abre como proyecto Android nativo en Android Studio
( carpeta `D:\AndroidStudioProjects\ebyfit-main\android` ).

Stack: AGP 9.4 · Gradle 9.6 · Kotlin 2.2.10 (plugin nativo de AGP, NO se aplica
`org.jetbrains.kotlin.android`) · Compose BOM 2025.01 · minSdk 24 · targetSdk 37 · paquete `com.ebyzom.ebyfit`.

```bash
cd android
./gradlew :app:assembleDebug        # APK: android/app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:installDebug         # si hay emulador/dispositivo conectado
```

- APK debug generado: **22 MB**, build verificado en esta máquina (JDK 21 + SDK 37).
- Los 7 sonidos viven en `android/app/src/main/res/raw/sfx_*.wav` (copia de `assets/sounds/`);
  regenerarlos: `node scripts/generate-sounds.mjs` y re-copiar.
- Firebase (opcional) se configura con variables de entorno al compilar, se hornean en `BuildConfig`:
  `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` (+ opcionales `FIREBASE_AUTH_DOMAIN`,
  `FIREBASE_SENDER_ID`, `FIREBASE_STORAGE_BUCKET`). Sin ellas la app corre en modo local.
  En Android Studio: Settings → Build Tools → Gradle → o `gradle.properties` local.
- Pantallas Compose: `android/app/src/main/java/com/ebyzom/ebyfit/ui/screens/` (Home, Plan,
  CheckIn, Progress, Profile, Login) + barra inferior personalizada en `ui/EbyfitApp.kt`.
- Tema con la paleta de EBYFIT (claro/oscuro) en `ui/theme/Theme.kt`; feedback de sonido/haptics
  en `feedback/FeedbackManager.kt`; persistencia en DataStore JSON (`data/`).
