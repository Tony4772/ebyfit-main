import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workoutId: varchar("workoutId", { length: 120 }).notNull(),
  workoutDate: varchar("workoutDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const checkIns = mysqlTable("check_ins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  checkInDate: varchar("checkInDate", { length: 10 }).notNull(),
  mood: varchar("mood", { length: 40 }).notNull(),
  energy: int("energy").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const weightEntries = mysqlTable("weight_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entryDate: varchar("entryDate", { length: 10 }).notNull(),
  value: decimal("value", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;
export type WeightEntry = typeof weightEntries.$inferSelect;
export type InsertWeightEntry = typeof weightEntries.$inferInsert;
