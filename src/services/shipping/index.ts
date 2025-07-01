import { Prisma } from "@prisma/client";
import { prisma } from "../../server";

class ShippingService {
  static async getAllShippingOptions({
    page = 1,
    limit = 10,
    search = "",
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const where = {
      name: {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const [options, total] = await Promise.all([
      prisma.shippingOption.findMany({
        where,
        include: { provider: true },
        orderBy: { cost: "asc" },
        skip,
        take: limit,
      }),
      prisma.shippingOption.count({ where }),
    ]);

    return {
      options,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async getAllShippingProviders({
    page = 1,
    limit = 10,
    search = "",
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const where = {
      name: {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const [providers, total] = await Promise.all([
      prisma.shippingProvider.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.shippingProvider.count({ where }),
    ]);

    return {
      providers,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async createShippingProvider(name: string) {
    const existing = await prisma.shippingProvider.findFirst({
      where: { name: { equals: name, mode: Prisma.QueryMode.insensitive } },
    });

    if (existing) {
      throw new Error("Shipping provider already exists.");
    }

    const provider = prisma.shippingProvider.create({
      data: { name },
      include: { options: true },
    });

    return provider;
  }

  static async createShippingOption({
    name,
    cost,
    estimatedDays,
    description,
    isActive,
    providerId,
  }: {
    name: string;
    cost: number;
    estimatedDays: number;
    description?: string;
    isActive: boolean;
    providerId: number;
  }) {
    const provider = await prisma.shippingProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error("Shipping provider not found.");
    }

    const option = await prisma.shippingOption.create({
      data: {
        name,
        cost,
        estimatedDays,
        description,
        isActive,
        provider: { connect: { id: providerId } },
      },
      include: { provider: true },
    });

    return option;
  }

  static async updateShippingOption({
    id,
    name,
    cost,
    estimatedDays,
    description,
    isActive,
    providerId,
  }: {
    id: number;
    name?: string;
    cost?: number;
    estimatedDays?: number;
    description?: string;
    isActive?: boolean;
    providerId?: number;
  }) {
    const existing = await prisma.shippingOption.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Shipping option not found.");
    }

    if (providerId) {
      const provider = await prisma.shippingProvider.findUnique({
        where: { id: providerId },
      });
      if (!provider) {
        throw new Error("Shipping provider not found.");
      }
    }

    const updated = await prisma.shippingOption.update({
      where: { id },
      data: {
        name,
        cost,
        estimatedDays,
        description,
        isActive,
        providerId,
      },
      include: { provider: true },
    });

    return updated;
  }

  static async updateShippingProvider({
    id,
    name,
  }: {
    id: number;
    name: string;
  }) {
    const existing = await prisma.shippingProvider.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("Shipping provider not found.");
    }

    const updated = await prisma.shippingProvider.update({
      where: { id },
      data: { name },
      include: { options: true },
    });

    return updated;
  }
}

export default ShippingService;
