// import { createTRPCRouter, publicProcedure } from "./trpc";

// export const appRouter = createTRPCRouter({
//   health: publicProcedure.query(() => ({
//     status: "ok" as const,
//   })),
// });

// export type AppRouter = typeof appRouter;

import { initTRPC } from "@trpc/server";
import { db } from "@repo/db";

const t = initTRPC.create();

export const appRouter = t.router({
  health: t.procedure.query(() => ({
    status: "ok" as const,
  })),
  database: t.router({
    userCount: t.procedure.query(async () => ({
      count: await db.user.count(),
    })),
  }),
});

export type AppRouter = typeof appRouter;
