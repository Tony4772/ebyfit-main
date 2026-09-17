import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useFitness, type CheckIn, type Mood, type WeightEntry, type WorkoutLog } from "@/lib/fitness-store";
import {
  reconcileCheckIns,
  reconcileWeights,
  reconcileWorkouts,
  type LocalCheckIn,
  type LocalWeight,
  type LocalWorkout,
} from "@/lib/sync/reconcile";
import { trpc } from "@/lib/trpc";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

type SyncContextValue = {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  /** Manual re-sync (pull + push diff). */
  syncNow: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

/** What the server is known to reflect after the last successful sync. */
type Snapshot = {
  workouts: LocalWorkout[];
  checkIns: LocalCheckIn[];
  weights: LocalWeight[];
};

const PUSH_DEBOUNCE_MS = 2000;

export function SyncProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const { hydrated, workoutLogs, checkIns, weightEntries, mergeSyncedData } = useFitness();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const firstSyncDoneRef = useRef(false);

  const pushMutation = trpc.fitness.sync.push.useMutation({
    onSuccess: (_data, variables) => {
      // The server now also reflects the pushed entries; fold them into the snapshot.
      const snapshot = snapshotRef.current ?? { workouts: [], checkIns: [], weights: [] };
      snapshotRef.current = {
        workouts: reconcileWorkouts(snapshot.workouts, variables.workouts).merged,
        checkIns: reconcileCheckIns(snapshot.checkIns, variables.checkIns).merged,
        weights: reconcileWeights(snapshot.weights, variables.weights).merged,
      };
      setStatus("synced");
      setLastSyncedAt(new Date());
    },
    onError: () => setStatus("error"),
  });

  const pullQuery = trpc.fitness.sync.pull.useQuery(undefined, {
    enabled: isAuthenticated && hydrated,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const localSnapshot = useCallback(
    (): Snapshot => ({
      workouts: workoutLogs.map((log) => ({ workoutId: log.workoutId, date: log.date })),
      checkIns: Object.values(checkIns).map((entry) => ({
        date: entry.date,
        mood: entry.mood,
        energy: entry.energy,
        note: entry.note,
      })),
      weights: weightEntries.map((entry) => ({ date: entry.date, value: entry.value })),
    }),
    [checkIns, weightEntries, workoutLogs],
  );

  /** First sync after login: pull server data, merge locally, push what is local-only. */
  useEffect(() => {
    if (!isAuthenticated || !hydrated) {
      firstSyncDoneRef.current = false;
      snapshotRef.current = null;
      setStatus("idle");
      return;
    }
    if (!pullQuery.data) return;

    setStatus("syncing");
    const remote = {
      workouts: pullQuery.data.workouts.map((row) => ({ workoutId: row.workoutId, date: row.workoutDate })),
      checkIns: pullQuery.data.checkIns.map((row) => ({
        date: row.checkInDate,
        mood: row.mood,
        energy: row.energy,
        note: row.note,
      })),
      weights: pullQuery.data.weights.map((row) => ({ date: row.entryDate, value: Number(row.value) })),
    };
    const local = localSnapshot();

    const workouts = reconcileWorkouts(local.workouts, remote.workouts);
    const checkInsReconciled = reconcileCheckIns(local.checkIns, remote.checkIns);
    const weights = reconcileWeights(local.weights, remote.weights);

    const pulledWorkoutLogs: WorkoutLog[] = workouts.pulled.map((entry) => ({
      id: `${entry.workoutId}-${entry.date}`,
      workoutId: entry.workoutId,
      date: entry.date,
    }));
    const pulledCheckIns: Record<string, CheckIn> = {};
    for (const entry of checkInsReconciled.pulled) {
      pulledCheckIns[entry.date] = {
        date: entry.date,
        mood: entry.mood as Mood,
        energy: entry.energy,
        note: entry.note,
      };
    }
    const pulledWeights: WeightEntry[] = weights.pulled.map((entry) => ({
      id: `sync-${entry.date}`,
      date: entry.date,
      value: entry.value,
    }));

    if (pulledWorkoutLogs.length || Object.keys(pulledCheckIns).length || pulledWeights.length) {
      mergeSyncedData({
        workoutLogs: [...workoutLogs, ...pulledWorkoutLogs],
        checkIns: { ...checkIns, ...pulledCheckIns },
        weightEntries: [...weightEntries, ...pulledWeights],
      });
    }

    snapshotRef.current = {
      workouts: workouts.merged,
      checkIns: checkInsReconciled.merged,
      weights: weights.merged,
    };

    if (workouts.toPush.length || checkInsReconciled.toPush.length || weights.toPush.length) {
      pushMutation.mutate({
        workouts: workouts.toPush,
        checkIns: checkInsReconciled.toPush,
        weights: weights.toPush,
      });
    } else {
      setStatus("synced");
      setLastSyncedAt(new Date());
    }
    firstSyncDoneRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hydrated, pullQuery.data]);

  /** Subsequent syncs: debounce-push the local-only diff against the last known server state. */
  useEffect(() => {
    if (!isAuthenticated || !hydrated || !firstSyncDoneRef.current || !snapshotRef.current) return;

    const local = localSnapshot();
    const snapshot = snapshotRef.current;
    const diff = {
      workouts: reconcileWorkouts(local.workouts, snapshot.workouts).toPush,
      checkIns: reconcileCheckIns(local.checkIns, snapshot.checkIns).toPush,
      weights: reconcileWeights(local.weights, snapshot.weights).toPush,
    };
    const hasChanges = diff.workouts.length > 0 || diff.checkIns.length > 0 || diff.weights.length > 0;
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      setStatus("syncing");
      pushMutation.mutate(diff);
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hydrated, workoutLogs, checkIns, weightEntries]);

  const syncNow = useCallback(() => {
    if (!isAuthenticated) return;
    setStatus("syncing");
    pullQuery.refetch();
  }, [isAuthenticated, pullQuery]);

  const value = useMemo<SyncContextValue>(() => ({ status, lastSyncedAt, syncNow }), [lastSyncedAt, status, syncNow]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used inside SyncProvider");
  }
  return context;
}
