import { db } from "@repo/db";
import { loginSchema } from "@repo/zod";
import { createTRPCRouter, publicProcedure } from "./trpc";

const authRouter = createTRPCRouter({
  login: publicProcedure.input(loginSchema).mutation(function login({ ctx }) {
    return ctx.authService.login();
  }),
});

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: publicProcedure.query(function health() {
    return { status: "ok" as const };
  }),
  database: createTRPCRouter({
    userCount: publicProcedure.query(async function userCount() {
      return { count: await db.user.count() };
    }),
  }),
});

export type AppRouter = typeof appRouter;
