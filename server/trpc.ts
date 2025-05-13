import { initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import prisma from "../lib/prisma";

export const createContext = (opts?: CreateNextContextOptions) => ({
  prisma,
});

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
