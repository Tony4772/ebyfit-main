/**
 * Pure reconciliation logic for local-first sync.
 *
 * The device is the source of truth: entries present locally are kept as-is,
 * server-only entries are pulled in, and local-only entries are flagged for push.
 * Merging is additive in both directions — nothing is ever dropped automatically,
 * so data loss requires an explicit user action (deleting an entry locally and
 * syncing, which removes it server-side by date).
 * All functions are pure so they can be unit-tested without React or the network.
 */

export type LocalWorkout = { workoutId: string; date: string };
export type RemoteWorkout = { workoutId: string; date: string };

export type LocalCheckIn = { date: string; mood: string; energy: number; note: string };
export type RemoteCheckIn = { date: string; mood: string; energy: number; note?: string | null };

export type LocalWeight = { date: string; value: number };
export type RemoteWeight = { date: string; value: number };

export type EntryReconciliation<T> = {
  /** Final local state after merging pulled entries. */
  merged: T[];
  /** Local entries the server is missing (to push). */
  toPush: T[];
  /** Server entries missing locally (already included in `merged`). */
  pulled: T[];
};

const workoutKey = (entry: { workoutId: string; date: string }) => `${entry.workoutId}|${entry.date}`;

/** Workout logs merge additively, keyed by (workoutId, date). */
export function reconcileWorkouts(local: LocalWorkout[], remote: RemoteWorkout[]): EntryReconciliation<LocalWorkout> {
  const localKeys = new Set(local.map(workoutKey));
  const remoteKeys = new Set(remote.map(workoutKey));

  const toPush = local.filter((entry) => !remoteKeys.has(workoutKey(entry)));
  const pulled = remote.filter((entry) => !localKeys.has(workoutKey(entry)));

  const merged = [...local, ...pulled].sort(compareByDateThenWorkout);

  return { merged, toPush, pulled };
}

/**
 * Check-ins are keyed by date and the local copy always wins:
 * - local entry missing on the server, or with different content -> push (overwrite)
 * - server-only dates -> pull
 * This makes local edits propagate to the server while conflicting remote
 * copies never overwrite what the user sees on-device.
 */
export function reconcileCheckIns(local: LocalCheckIn[], remote: RemoteCheckIn[]): EntryReconciliation<LocalCheckIn> {
  const localDates = new Set(local.map((entry) => entry.date));
  const remoteByDate = new Map(remote.map((entry) => [entry.date, entry]));

  const toPush = local.filter((entry) => {
    const counterpart = remoteByDate.get(entry.date);
    if (!counterpart) return true;
    return (
      counterpart.mood !== entry.mood ||
      counterpart.energy !== entry.energy ||
      (counterpart.note ?? "") !== entry.note
    );
  });
  const pulled = remote.filter((entry) => !localDates.has(entry.date)).map(toLocalCheckIn);
  const merged = [...local, ...pulled].sort(byDateDesc);

  return { merged, toPush, pulled };
}

/**
 * Weight entries are keyed by date and the local copy always wins:
 * differing values push (overwrite), server-only dates pull.
 */
export function reconcileWeights(local: LocalWeight[], remote: RemoteWeight[]): EntryReconciliation<LocalWeight> {
  const localDates = new Set(local.map((entry) => entry.date));
  const remoteByDate = new Map(remote.map((entry) => [entry.date, entry]));

  const toPush = local.filter((entry) => {
    const counterpart = remoteByDate.get(entry.date);
    return !counterpart || Number(counterpart.value) !== Number(entry.value);
  });
  const pulled = remote.filter((entry) => !localDates.has(entry.date));
  const merged = [...local, ...pulled].sort(byDateDesc);

  return { merged, toPush, pulled };
}

function toLocalCheckIn(entry: RemoteCheckIn): LocalCheckIn {
  return { date: entry.date, mood: entry.mood, energy: entry.energy, note: entry.note ?? "" };
}

/** Newest first; deterministic tiebreaker keeps pure outputs stable. */
function compareByDateThenWorkout(a: { date: string; workoutId: string }, b: { date: string; workoutId: string }): number {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return a.workoutId.localeCompare(b.workoutId);
}

function byDateDesc(a: { date: string }, b: { date: string }): number {
  return b.date.localeCompare(a.date);
}
