import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("fitness authorization", () => {
  it("rejects the fitness summary without an authenticated user", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: { host: "localhost" }, hostname: "localhost" } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.fitness.summary()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
