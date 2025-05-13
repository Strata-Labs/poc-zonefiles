// server/routers/user.ts

import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  getByStacksAddress: publicProcedure
    .input(z.object({ stacksAddress: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { stacksAddress: input.stacksAddress },
        include: { domains: true },
      });
      return user;
    }),

  create: publicProcedure
    .input(z.object({ stacksAddress: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { stacksAddress: input.stacksAddress },
      });

      if (existingUser) {
        return existingUser;
      }

      // Create new user
      const newUser = await ctx.prisma.user.create({
        data: {
          stacksAddress: input.stacksAddress,
        },
      });

      return newUser;
    }),
});
