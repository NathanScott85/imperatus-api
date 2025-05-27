import { Prisma } from "@prisma/client";
import { prisma } from "../../server";

class VatService {
  async getAllVATRecords(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [records, totalCount] = await Promise.all([
      prisma.vATRecord.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.vATRecord.count(),
    ]);

    return {
      vatRecords: records,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

  async createVATRecord(
    tx: Prisma.TransactionClient = prisma,
    {
      orderId,
      orderNumber,
      vatAmount,
      subtotal,
      total,
    }: {
      orderId: number;
      orderNumber: string;
      vatAmount: number;
      subtotal: number;
      total: number;
    }
  ) {
    return tx.vATRecord.create({
      data: {
        orderId,
        orderNumber,
        vatAmount,
        subtotal,
        total,
      },
    });
  }

  async updateVATRecord(
    tx: Prisma.TransactionClient,
    {
      orderId,
      orderNumber,
      vatAmount,
      subtotal,
      total,
      status,
    }: {
      orderId: number;
      orderNumber: string;
      vatAmount: number;
      subtotal: number;
      total: number;
      status?: string;
    }
  ) {
    const existing = await tx.vATRecord.findFirst({
      where: { orderId },
      select: { id: true },
    });

    const data = {
      vatAmount: new Prisma.Decimal(vatAmount),
      subtotal: new Prisma.Decimal(subtotal),
      total: new Prisma.Decimal(total),
      ...(status && { status }),
    };

    if (existing) {
      return tx.vATRecord.update({
        where: { id: existing.id },
        data,
      });
    }

    return tx.vATRecord.create({
      data: {
        orderId,
        orderNumber,
        ...data,
      },
    });
  }

  async getTotalVAT() {
    const result = await prisma.vATRecord.aggregate({
      _sum: {
        vatAmount: true,
      },
      where: {
        status: { notIn: ["cancelled", "refunded"] },
      },
    });
    return result._sum.vatAmount ?? 0;
  }
}

export default new VatService();
