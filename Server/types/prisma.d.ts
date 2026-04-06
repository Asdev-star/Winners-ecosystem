import type { Prisma } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    dropshippingResearch: {
      count(args: {
        where?: {
          tenantId?: string;
          userId?: string;
          tool?: string;
          createdAt?: { gte?: Date };
        };
      }): Promise<number>;
      create(args: {
        data: {
          tenantId: string;
          userId: string;
          tool: string;
          input: Prisma.InputJsonValue;
          output: Prisma.InputJsonValue;
        };
      }): Promise<unknown>;
    };
  }
}
