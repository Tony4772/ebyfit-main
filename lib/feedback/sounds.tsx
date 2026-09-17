import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";

export type SfxName = "tap" | "select" | "toggle" | "success" | "streak" | "whoosh" | "counter";

// Static requires so Metro bundles the assets.
const SOURCES = {
  tap: require("@/assets/sounds/tap.wav"),
  select: require("@/assets/sounds/select.wav"),
  toggle: require("@/assets/sounds/toggle.wav"),
  success: require("@/assets/sounds/success.wav"),
  streak: require("@/assets/sounds/streak.wav"),
  whoosh: require("@/assets/sounds/whoosh.wav"),
  counter: require("@/assets/sounds/counter.wav"),
} as const;

/** Per-clip loudness so ticks stay subtle and celebrations pop. */
const SOUND_VOLUMES: Record<SfxName, number> = {
  tap: 0.5,
  select: 0.7,
  toggle: 0.7,
  success: 0.9,
  streak: 1,
  whoosh: 0.55,
  counter: 0.4,
};

const SETTINGS_KEY = "@ebyfit/feedback-settings-v1";

export type FeedbackSettings = {
  soundOn: boolean;
  hapticsOn: boolean;
};

const DEFAULT_SETTINGS: FeedbackSettings = { soundOn: true, hapticsOn: true };

let cachedSettings: FeedbackSettings | null = null;

/** Load-once helper usable before hydration (splash screens, shell components). */
export async function readFeedbackSettings(): Promise<FeedbackSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    cachedSettings = raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<FeedbackSettings>) } : DEFAULT_SETTINGS;
  } catch {
    cachedSettings = DEFAULT_SETTINGS;
  }
  return cachedSettings;
}

type FeedbackContextValue = {
  play: (name: SfxName) => void;
  haptic: (style?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType) => void;
  celebrate: () => void;
  settings: FeedbackSettings;
  updateSettings: (patch: Partial<FeedbackSettings>) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * Loads every clip into an AudioPlayer after client mount.
 * Players cannot be created during SSR (web `Audio` doesn't exist in Node),
 * so this component only renders once the app is running in the browser/device.
 */
function PlayerLoader({ playersRef }: { playersRef: MutableRefObject<Record<SfxName, AudioPlayer> | null> }) {
  const tap = useAudioPlayer(SOURCES.tap);
  const select = useAudioPlayer(SOURCES.select);
  const toggle = useAudioPlayer(SOURCES.toggle);
  const success = useAudioPlayer(SOURCES.success);
  const streak = useAudioPlayer(SOURCES.streak);
  const whoosh = useAudioPlayer(SOURCES.whoosh);
  const counter = useAudioPlayer(SOURCES.counter);

  useEffect(() => {
    const players: Record<SfxName, AudioPlayer> = { tap, select, toggle, success, streak, whoosh, counter };
    (Object.keys(players) as SfxName[]).forEach((name) => {
      try {
        players[name].volume = SOUND_VOLUMES[name];
      } catch {
        // Volume is a nicety, not a requirement.
      }
    });
    playersRef.current = players;
  }, [counter, playersRef, select, streak, success, tap, toggle, whoosh]);

  return null;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FeedbackSettings>(cachedSettings ?? DEFAULT_SETTINGS);
  // Players exist only on the client; SSR renders a no-op context value.
  const [mounted, setMounted] = useState(false);
  const playersRef = useRef<Record<SfxName, AudioPlayer> | null>(null);
  const busy = useRef<Set<SfxName>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let alive = true;
    readFeedbackSettings().then((value) => {
      if (alive) setSettings(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      if (!settings.soundOn) return;
      const player = playersRef.current?.[name];
      const inFlight = busy.current;
      if (!player || inFlight.has(name)) return;
      inFlight.add(name);
      try {
        void player.seekTo(0).catch(() => undefined);
        player.play();
      } catch {
        // Best-effort: never break an interaction over audio.
      }
      const ms = Math.max(120, Math.round((player.duration || 0.3) * 1000));
      setTimeout(() => inFlight.delete(name), ms);
    },
    [settings.soundOn],
  );

  const haptic = useCallback(
    (style: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType = Haptics.ImpactFeedbackStyle.Light) => {
      if (!settings.hapticsOn) return;
      if ((style as string) in Haptics.NotificationFeedbackType) {
        Haptics.notificationAsync(style as Haptics.NotificationFeedbackType);
        return;
      }
      Haptics.impactAsync(style as Haptics.ImpactFeedbackStyle).catch(() => undefined);
    },
    [settings.hapticsOn],
  );

  const celebrate = useCallback(() => {
    play("streak");
    if (settings.hapticsOn) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  }, [play, settings.hapticsOn]);

  const updateSettings = useCallback((patch: Partial<FeedbackSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      cachedSettings = next;
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<FeedbackContextValue>(
    () => ({ play, haptic, celebrate, settings, updateSettings }),
    [celebrate, haptic, play, settings, updateSettings],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {mounted && <PlayerLoader playersRef={playersRef} />}
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside FeedbackProvider");
  return ctx;
}

/** Convenience hook: fire sound + haptic together. */
export function useSfx() {
  const { play, haptic } = useFeedback();
  return useCallback(
    (name: SfxName, style?: Haptics.ImpactFeedbackStyle) => {
      play(name);
      haptic(style);
    },
    [haptic, play],
  );
}
