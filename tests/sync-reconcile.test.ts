import { describe, expect, it } from "vitest";
import { reconcileCheckIns, reconcileWeights, reconcileWorkouts } from "../lib/sync/reconcile";

describe("reconcileWorkouts", () => {
  it("merges additively and flags push/pull sets", () => {
    const local = [
      { workoutId: "b", date: "2026-09-14" },
      { workoutId: "a", date: "2026-09-15" },
    ];
    const remote = [
      { workoutId: "a", date: "2026-09-15" },
      { workoutId: "c", date: "2026-09-12" },
    ];

    const result = reconcileWorkouts(local, remote);

    // local-only -> push; remote-only -> pull
    expect(result.toPush).toEqual([{ workoutId: "b", date: "2026-09-14" }]);
    expect(result.pulled).toEqual([{ workoutId: "c", date: "2026-09-12" }]);

    // merged keeps local entries untouched and appends pulled ones, newest first
    expect(result.merged).toEqual([
      { workoutId: "a", date: "2026-09-15" },
      { workoutId: "b", date: "2026-09-14" },
      { workoutId: "c", date: "2026-09-12" },
    ]);
  });

  it("does not duplicate entries present on both sides", () => {
    const result = reconcileWorkouts(
      [{ workoutId: "a", date: "2026-09-15" }],
      [{ workoutId: "a", date: "2026-09-15" }],
    );

    expect(result.toPush).toEqual([]);
    expect(result.pulled).toEqual([]);
    expect(result.merged).toEqual([{ workoutId: "a", date: "2026-09-15" }]);
  });

  it("is idempotent: reconciling the merged result again is a no-op", () => {
    const local = [{ workoutId: "a", date: "2026-09-15" }];
    const remote = [{ workoutId: "b", date: "2026-09-14" }];

    const first = reconcileWorkouts(local, remote);

    // Simulate the push having completed: the server now also holds 'a'.
    const second = reconcileWorkouts(first.merged, [...remote, ...first.toPush]);

    expect(second.toPush).toEqual([]);
    expect(second.pulled).toEqual([]);
    expect(second.merged).toEqual(first.merged);
  });
});

describe("reconcileCheckIns", () => {
  it("local wins on conflicting dates and pulls missing ones", () => {
    const local = [{ date: "2026-09-15", mood: "Bien", energy: 4, note: "local" }];
    const remote = [
      { date: "2026-09-15", mood: "Cansado", energy: 2, note: "remote" },
      { date: "2026-09-13", mood: "Energía alta", energy: 5, note: null },
    ];

    const result = reconcileCheckIns(local, remote);

    expect(result.toPush).toEqual([{ date: "2026-09-15", mood: "Bien", energy: 4, note: "local" }]);
    expect(result.pulled).toEqual([{ date: "2026-09-13", mood: "Energía alta", energy: 5, note: "" }]);
    expect(result.merged).toEqual([
      { date: "2026-09-15", mood: "Bien", energy: 4, note: "local" },
      { date: "2026-09-13", mood: "Energía alta", energy: 5, note: "" },
    ]);
  });
});

describe("reconcileWeights", () => {
  it("local wins on conflicting dates and sorts newest first", () => {
    const local = [{ date: "2026-09-15", value: 71.5 }];
    const remote = [
      { date: "2026-09-15", value: 70.2 },
      { date: "2026-09-10", value: 72.0 },
    ];

    const result = reconcileWeights(local, remote);

    expect(result.toPush).toEqual([{ date: "2026-09-15", value: 71.5 }]);
    expect(result.merged).toEqual([
      { date: "2026-09-15", value: 71.5 },
      { date: "2026-09-10", value: 72.0 },
    ]);
  });

  it("handles empty sides without mutating inputs", () => {
    const local = [{ date: "2026-09-15", value: 71.5 }];
    const result = reconcileWeights(local, []);

    expect(result.merged).toEqual(local);
    expect(result.pulled).toEqual([]);
    expect(result.toPush).toEqual(local);
    expect(result.merged).not.toBe(local);
  });
});
