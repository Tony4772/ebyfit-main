import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  checkIns,
  type InsertCheckIn,
  type InsertUser,
  type InsertWeightEntry,
  type InsertWorkoutLog,
  users,
  weightEntries,
  workoutLogs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserWorkoutLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)).orderBy(desc(workoutLogs.workoutDate));
}

export async function createWorkoutLog(data: InsertWorkoutLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, data.userId), eq(workoutLogs.workoutId, data.workoutId), eq(workoutLogs.workoutDate, data.workoutDate)))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [result] = await db.insert(workoutLogs).values(data);
  return result.insertId;
}

export async function deleteWorkoutLog(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workoutLogs).where(and(eq(workoutLogs.id, id), eq(workoutLogs.userId, userId)));
}

export async function getUserCheckIns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkIns).where(eq(checkIns.userId, userId)).orderBy(desc(checkIns.checkInDate));
}

export async function upsertCheckIn(data: InsertCheckIn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(and(eq(checkIns.userId, data.userId), eq(checkIns.checkInDate, data.checkInDate)))
    .limit(1);
  if (existing[0]) {
    await db.update(checkIns).set({ mood: data.mood, energy: data.energy, note: data.note ?? null }).where(eq(checkIns.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(checkIns).values(data);
  return result.insertId;
}

export async function getUserWeightEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weightEntries).where(eq(weightEntries.userId, userId)).orderBy(desc(weightEntries.entryDate));
}

export async function addWeightEntry(data: InsertWeightEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(weightEntries).values(data);
  return result.insertId;
}

/** Idempotent write used by sync: exactly one row per (user, date). */
export async function setWeightForDate(data: InsertWeightEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: weightEntries.id })
    .from(weightEntries)
    .where(and(eq(weightEntries.userId, data.userId), eq(weightEntries.entryDate, data.entryDate)))
    .limit(1);
  if (existing[0]) {
    await db.update(weightEntries).set({ value: data.value }).where(eq(weightEntries.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(weightEntries).values(data);
  return result.insertId;
}
