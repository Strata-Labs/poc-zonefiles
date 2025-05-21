// server/routers/domain.ts (updated)

import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { verifyDomainOwnership } from "../../utils/domainUtils";
import { verifySignature } from "../../utils/signatureUtils";
import {
  verifyEthereumSignature,
  verifySolanaSignature,
} from "../../utils/wallets";
import { Prisma } from "@prisma/client";

// Define Chain enum to match Prisma schema
const ChainEnum = z.enum(["BTC", "ETH", "SOL"]);

export const domainRouter = router({
  // Get a domain by name
  getByName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { name: input.name },
        include: { addresses: true, owner: true },
      });
      return domain;
    }),

  // Get address by domain name and chain
  getAddressByDomainAndChain: publicProcedure
    .input(
      z.object({
        domainName: z.string(),
        chain: ChainEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { domainName, chain } = input;

      const domain = await ctx.prisma.domain.findUnique({
        where: { name: domainName },
        include: {
          addresses: chain
            ? {
                where: { chain },
              }
            : true,
        },
      });

      if (!domain || domain.addresses.length === 0) {
        return null;
      }

      return domain.addresses;
    }),

  // Get domains by owner address
  getByOwner: publicProcedure
    .input(z.object({ ownerStacksAddress: z.string() }))
    .query(async ({ ctx, input }) => {
      const domains = await ctx.prisma.domain.findMany({
        where: { ownerStacksAddress: input.ownerStacksAddress },
        include: { addresses: true },
      });
      return domains;
    }),

  // Create a new domain with ownership verification
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        ownerStacksAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if domain already exists in our database
        const existingDomain = await ctx.prisma.domain.findUnique({
          where: { name: input.name },
        });

        if (existingDomain) {
          throw new Error("Domain already exists in our system");
        }

        // Verify domain ownership against BNSv2 API
        const ownershipInfo = await verifyDomainOwnership(
          input.name,
          input.ownerStacksAddress
        );

        if (!ownershipInfo.isOwner) {
          throw new Error(
            ownershipInfo.error || "Failed to verify domain ownership"
          );
        }

        // Create the new domain after verifying ownership
        const newDomain = await ctx.prisma.domain.create({
          data: {
            name: input.name,
            ownerStacksAddress: input.ownerStacksAddress,
          },
        });

        return newDomain;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            const field = (error.meta?.target as string[]) || ["unknown field"];
            throw new Error(
              `Domain with this ${field.join(", ")} already exists`
            );
          }
        }
        throw error;
      }
    }),

  // Add an address to a domain with signature verification
  addAddress: publicProcedure
    .input(
      z.object({
        domainId: z.string(),
        address: z.string(),
        chain: ChainEnum,
        signature: z.string(),
        publicKey: z.string(),
        verificationMethod: z.enum(["stacks", "native"]).default("stacks"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const {
          domainId,
          address,
          chain,
          signature,
          publicKey,
          verificationMethod,
        } = input;

        console.log("AddAddress mutation input:", {
          domainId,
          address,
          chain,
          signatureLength: signature.length,
          publicKey,
          verificationMethod,
        });

        // Check if the domain exists
        const domain = await ctx.prisma.domain.findUnique({
          where: { id: domainId },
        });

        if (!domain) {
          throw new Error("Domain not found");
        }

        console.log("Domain found:", {
          domainName: domain.name,
          ownerAddress: domain.ownerStacksAddress,
        });

        // Verify the signature based on verification method
        let isSignatureValid = false;

        if (verificationMethod === "stacks") {
          // Legacy Stacks verification
          const message = `I authorize adding ${chain} address ${address} to domain ${domain.name}`;
          isSignatureValid = verifySignature(message, signature, publicKey);
        } else if (verificationMethod === "native") {
          // Native verification based on chain
          const message = `I am the owner of this ${chain} address: ${address} and I authorize its addition to domain ${domain.name}`;

          if (chain === "ETH") {
            isSignatureValid = verifyEthereumSignature(
              message,
              signature,
              address
            );
          } else if (chain === "SOL") {
            isSignatureValid = verifySolanaSignature(
              message,
              signature,
              address
            );
          } else {
            // For BTC, we'll still use Stacks verification
            const stacksMessage = `I authorize adding ${chain} address ${address} to domain ${domain.name}`;
            isSignatureValid = verifySignature(
              stacksMessage,
              signature,
              publicKey
            );
          }
        }

        console.log("Signature validation result:", isSignatureValid);

        if (!isSignatureValid) {
          throw new Error("Invalid signature. Authorization failed.");
        }

        // Check if the address is already linked to this domain
        const existingAddress = await ctx.prisma.address.findFirst({
          where: {
            domainId,
            address,
            chain,
          },
        });

        if (existingAddress) {
          return existingAddress;
        }

        // Create the new address
        const newAddress = await ctx.prisma.address.create({
          data: {
            address,
            chain,
            domainId,
          },
        });

        return newAddress;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            const fields = (error.meta?.target as string[]) || [
              "unknown field",
            ];
            if (fields.includes("address") && fields.includes("chain")) {
              throw new Error(
                `This ${input.chain} address is already registered in the system. Each address can only be registered once per blockchain.`
              );
            } else {
              throw new Error(
                `Unique constraint violation on ${fields.join(", ")}`
              );
            }
          }
        }
        throw error;
      }
    }),

  // Remove an address from a domain with signature verification
  removeAddress: publicProcedure
    .input(
      z.object({
        addressId: z.string(),
        signature: z.string(),
        publicKey: z.string(),
        verificationMethod: z.enum(["stacks", "native"]).default("stacks"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { addressId, signature, publicKey, verificationMethod } = input;

        console.log("RemoveAddress mutation input:", {
          addressId,
          signatureLength: signature.length,
          publicKey,
          verificationMethod,
        });

        // Find the address and include domain information
        const address = await ctx.prisma.address.findUnique({
          where: { id: addressId },
          include: {
            domain: true,
          },
        });

        if (!address) {
          throw new Error("Address not found");
        }

        const { domain } = address;

        console.log("Address found:", {
          addressId: address.id,
          chain: address.chain,
          address: address.address,
          domainName: domain.name,
          ownerAddress: domain.ownerStacksAddress,
        });

        // Verify the signature based on verification method
        let isSignatureValid = false;

        if (verificationMethod === "stacks") {
          // Legacy Stacks verification
          const message = `I authorize removing ${address.chain} address ${address.address} from domain ${domain.name}`;
          isSignatureValid = verifySignature(message, signature, publicKey);
        } else if (verificationMethod === "native") {
          // Native verification based on chain
          const message = `I am the owner of this ${address.chain} address: ${address.address} and I authorize its removal from domain ${domain.name}`;

          if (address.chain === "ETH") {
            isSignatureValid = verifyEthereumSignature(
              message,
              signature,
              address.address
            );
          } else if (address.chain === "SOL") {
            isSignatureValid = verifySolanaSignature(
              message,
              signature,
              address.address
            );
          } else {
            // For BTC, we'll still use Stacks verification
            const stacksMessage = `I authorize removing ${address.chain} address ${address.address} from domain ${domain.name}`;
            isSignatureValid = verifySignature(
              stacksMessage,
              signature,
              publicKey
            );
          }
        }

        console.log("Signature validation result:", isSignatureValid);

        if (!isSignatureValid) {
          throw new Error("Invalid signature. Authorization failed.");
        }

        // Remove the address
        const removedAddress = await ctx.prisma.address.delete({
          where: { id: addressId },
        });

        return {
          success: true,
          message: `Successfully removed ${address.chain} address from domain ${domain.name}`,
          removedAddress: removedAddress,
        };
      } catch (error) {
        console.error("Error removing address:", error);

        // Re-throw the error with a clear message
        if (error instanceof Error) {
          throw new Error(`Failed to remove address: ${error.message}`);
        } else {
          throw new Error("Failed to remove address due to an unknown error");
        }
      }
    }),

  // Reverse lookup: get domain by address
  getDomainByAddress: publicProcedure
    .input(
      z.object({
        address: z.string(),
        chain: ChainEnum,
      })
    )
    .query(async ({ ctx, input }) => {
      const { address, chain } = input;

      const addressRecord = await ctx.prisma.address.findFirst({
        where: {
          address,
          chain,
        },
        include: {
          domain: true,
        },
      });

      if (!addressRecord) {
        return null;
      }

      return addressRecord.domain;
    }),
});
