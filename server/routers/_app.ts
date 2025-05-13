// server/routers/_app.ts

import { router } from "../trpc";
import { userRouter } from "./user";
import { domainRouter } from "./domain";

export const appRouter = router({
  user: userRouter,
  domain: domainRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
