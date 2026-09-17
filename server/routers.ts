import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import type { InsertWeightEntry, InsertWorkoutLog } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar YYYY-MM-DD");

const checkInSchema = z.object({
  date: dateSchema,
  mood: z.string().min(1).max(40),
  energy: z.number().int().min(1).max(5),
  note: z.string().max(240).optional(),
});

const syncPushSchema = z.object({
  workouts: z
    .array(z.object({ workoutId: z.string().min(1).max(120), date: dateSchema }))
    .max(1000),
  checkIns: z.array(checkInSchema).max(400),
  weights: z.array(z.object({ date: dateSchema, value: z.number().positive().max(500) })).max(400),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  fitness: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const [workouts, checkIns, weights] = await Promise.all([
        db.getUserWorkoutLogs(ctx.user.id),
        db.getUserCheckIns(ctx.user.id),
        db.getUserWeightEntries(ctx.user.id),
      ]);
      return { workouts, checkIns, weights };
    }),
    workouts: router({
      complete: protectedProcedure
        .input(z.object({ workoutId: z.string().min(1).max(120), date: dateSchema }))
        .mutation(({ ctx, input }) => db.createWorkoutLog({ userId: ctx.user.id, workoutId: input.workoutId, workoutDate: input.date })),
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ ctx, input }) => db.deleteWorkoutLog(input.id, ctx.user.id)),
    }),
    checkIn: router({
      save: protectedProcedure
        .input(z.object({ date: dateSchema, mood: z.string().min(1).max(40), energy: z.number().int().min(1).max(5), note: z.string().max(240).optional() }))
        .mutation(({ ctx, input }) => db.upsertCheckIn({ userId: ctx.user.id, checkInDate: input.date, mood: input.mood, energy: input.energy, note: input.note })),
    }),
    weight: router({
      add: protectedProcedure
        .input(z.object({ date: dateSchema, value: z.number().positive().max(500) }))
        .mutation(({ ctx, input }) => db.addWeightEntry({ userId: ctx.user.id, entryDate: input.date, value: input.value.toFixed(2) })),
      /** Idempotent write used by sync: one row per (user, date). */
      setDate: protectedProcedure
        .input(z.object({ date: dateSchema, value: z.number().positive().max(500) }))
        .mutation(async ({ ctx, input }) => {
          await db.setWeightForDate({ userId: ctx.user.id, entryDate: input.date, value: input.value.toFixed(2) });
          return { success: true } as const;
        }),
    }),
    sync: router({
      /** Full snapshot of the user's server data for local-first reconciliation. */
      pull: protectedProcedure.query(async ({ ctx }) => {
        const [workouts, checkIns, weights] = await Promise.all([
          db.getUserWorkoutLogs(ctx.user.id),
          db.getUserCheckIns(ctx.user.id),
          db.getUserWeightEntries(ctx.user.id),
        ]);
        return { workouts, checkIns, weights };
      }),
      /** Push a batch of local entries; every write is idempotent, safe to retry. */
      push: protectedProcedure
        .input(syncPushSchema)
        .mutation(async ({ ctx, input }) => {
          const workoutRows: InsertWorkoutLog[] = input.workouts.map((entry) => ({
            userId: ctx.user.id,
            workoutId: entry.workoutId,
            workoutDate: entry.date,
          }));
          for (const row of workoutRows) {
            await db.createWorkoutLog(row);
          }
          for (const entry of input.checkIns) {
            await db.upsertCheckIn({
              userId: ctx.user.id,
              checkInDate: entry.date,
              mood: entry.mood,
              energy: entry.energy,
              note: entry.note,
            });
          }
          for (const entry of input.weights) {
            await db.setWeightForDate({ userId: ctx.user.id, entryDate: entry.date, value: entry.value.toFixed(2) });
          }
          return {
            pushed: {
              workouts: workoutRows.length,
              checkIns: input.checkIns.length,
              weights: input.weights.length,
            },
          } as const;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
