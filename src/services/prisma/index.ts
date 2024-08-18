import { PrismaClient } from "@prisma/client";

class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
    return PrismaService.instance;
  }

  public async disconnect(): Promise<void> {
    await PrismaService.instance.$disconnect();
  }
}

export default PrismaService;
