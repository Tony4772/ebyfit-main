import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

export type Mood = "Energía alta" | "Bien" | "Cansado" | "Necesito recuperar";

export type CheckIn = {
  date: string;
  mood: Mood;
  energy: number;
  note: string;
};

export type WorkoutLog = {
  id: string;
  workoutId: string;
  date: string;
};

export type WeightEntry = {
  id: string;
  date: string;
  value: number;
};

export type FitnessState = {
  workoutLogs: WorkoutLog[];
  checkIns: Record<string, CheckIn>;
  weightEntries: WeightEntry[];
};

type FitnessContextValue = FitnessState & {
  hydrated: boolean;
  toggleWorkout: (workoutId: string, date?: Date) => void;
  isWorkoutComplete: (workoutId: string, date?: Date) => boolean;
  saveCheckIn: (checkIn: Omit<CheckIn, "date">, date?: Date) => void;
  addWeight: (value: number, date?: Date) => void;
  /** Bulk write used by account sync to merge pulled server entries into local state. */
  mergeSyncedData: (data: Partial<FitnessState>) => void;
  totalSessions: number;
  weeklySessions: number;
  streak: number;
};

const STORAGE_KEY = "@ebyfit/fitness-state-v1";
const EMPTY_STATE: FitnessState = {
  workoutLogs: [],
  checkIns: {},
  weightEntries: [],
};

export function getDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekStart(date = new Date()): Date {
  const result = new Date(date);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function getWeekDates(date = new Date()): Date[] {
  const monday = getWeekStart(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function countWeeklySessions(logs: WorkoutLog[], date = new Date()): number {
  const weekStart = getWeekStart(date).getTime();
  const nextWeek = new Date(getWeekStart(date));
  nextWeek.setDate(nextWeek.getDate() + 7);
  return logs.filter((log) => {
    const timestamp = new Date(`${log.date}T12:00:00`).getTime();
    return timestamp >= weekStart && timestamp < nextWeek.getTime();
  }).length;
}

function countStreak(logs: WorkoutLog[], date = new Date()): number {
  const loggedDates = new Set(logs.map((log) => log.date));
  const cursor = new Date(date);
  cursor.setHours(12, 0, 0, 0);
  let result = 0;

  while (loggedDates.has(getDateKey(cursor))) {
    result += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return result;
}

const FitnessContext = createContext<FitnessContextValue | null>(null);

export function FitnessProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FitnessState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Partial<FitnessState>;
          setState({
            workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
            checkIns: parsed.checkIns ?? {},
            weightEntries: Array.isArray(parsed.weightEntries) ? parsed.weightEntries : [],
          });
        } catch {
          setState(EMPTY_STATE);
        }
      })
      .catch(() => setState(EMPTY_STATE))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  const toggleWorkout = useCallback((workoutId: string, date = new Date()) => {
    const dateKey = getDateKey(date);
    setState((current) => {
      const existingIndex = current.workoutLogs.findIndex(
        (log) => log.workoutId === workoutId && log.date === dateKey,
      );
      if (existingIndex >= 0) {
        return {
          ...current,
          workoutLogs: current.workoutLogs.filter((_, index) => index !== existingIndex),
        };
      }
      return {
        ...current,
        workoutLogs: [
          ...current.workoutLogs,
          { id: `${workoutId}-${dateKey}`, workoutId, date: dateKey },
        ],
      };
    });
  }, []);

  const isWorkoutComplete = useCallback(
    (workoutId: string, date = new Date()) => {
      const dateKey = getDateKey(date);
      return state.workoutLogs.some((log) => log.workoutId === workoutId && log.date === dateKey);
    },
    [state.workoutLogs],
  );

  const saveCheckIn = useCallback((checkIn: Omit<CheckIn, "date">, date = new Date()) => {
    const dateKey = getDateKey(date);
    setState((current) => ({
      ...current,
      checkIns: { ...current.checkIns, [dateKey]: { ...checkIn, date: dateKey } },
    }));
  }, []);

  const addWeight = useCallback((value: number, date = new Date()) => {
    const dateKey = getDateKey(date);
    setState((current) => ({
      ...current,
      weightEntries: [
        ...current.weightEntries.filter((entry) => entry.date !== dateKey),
        { id: `${dateKey}-${Date.now()}`, date: dateKey, value },
      ].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, []);

  const mergeSyncedData = useCallback((data: Partial<FitnessState>) => {
    setState((current) => ({
      ...current,
      workoutLogs: data.workoutLogs ?? current.workoutLogs,
      checkIns: data.checkIns ?? current.checkIns,
      weightEntries: data.weightEntries ?? current.weightEntries,
    }));
  }, []);

  const value = useMemo<FitnessContextValue>(
    () => ({
      ...state,
      hydrated,
      toggleWorkout,
      isWorkoutComplete,
      saveCheckIn,
      addWeight,
      mergeSyncedData,
      totalSessions: state.workoutLogs.length,
      weeklySessions: countWeeklySessions(state.workoutLogs),
      streak: countStreak(state.workoutLogs),
    }),
    [addWeight, hydrated, isWorkoutComplete, mergeSyncedData, saveCheckIn, state, toggleWorkout],
  );

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
}

export function useFitness(): FitnessContextValue {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error("useFitness must be used inside FitnessProvider");
  }
  return context;
}
