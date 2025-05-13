import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import moment from "moment";

class DiscountCodeService {
  async getDiscountCodeByCode(code: string) {
    return prisma.discountCode.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
    });
  }

  async getDiscountCodeById(id: number) {
    return prisma.discountCode.findUnique({
      where: { id },
    });
  }

  async createDiscountCode({
    code,
    description,
    type,
    value,
    expiresAt,
    isAffiliate = false,
    active = true,
  }: {
    code: string;
    description?: string;
    type: "percentage" | "fixed";
    value: number;
    expiresAt?: Date;
    isAffiliate?: boolean;
    active?: boolean;
  }) {
    return prisma.discountCode.create({
      data: {
        code,
        description,
        type,
        value,
        isAffiliate,
        active,
        expiresAt: expiresAt ? moment(expiresAt).toDate() : undefined,
      },
    });
  }

  async getAllDiscountCodes(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) {
    try {
      const offset = (page - 1) * limit;

      const whereClause: Prisma.DiscountCodeWhereInput | undefined = search
        ? {
            OR: [
              {
                code: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : undefined;

      const [discountCodes, totalCount] = await Promise.all([
        prisma.discountCode.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.discountCode.count({
          where: whereClause,
        }),
      ]);

      return {
        discountCodes,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error retrieving discount codes", error);
      throw new Error(`Unable to fetch discount codes, ${error}`);
    }
  }

  async updateDiscountCode(
    id: number,
    data: {
      code?: string;
      description?: string;
      type?: "percentage" | "fixed";
      value?: number;
      expiresAt?: string | Date;
      active?: boolean;
      isAffiliate?: boolean;
    }
  ): Promise<any> {
    try {
      const existing = await prisma.discountCode.findUnique({ where: { id } });

      if (!existing) {
        throw new Error("Discount code not found");
      }

      const { code, description, type, value, expiresAt, active, isAffiliate } =
        data;

      const updated = await prisma.discountCode.update({
        where: { id },
        data: {
          code,
          description,
          type,
          value,
          active,
          isAffiliate,
          expiresAt: expiresAt ? moment(expiresAt).toDate() : undefined,
        },
      });

      return updated;
    } catch (err) {
      console.error("Failed to update discount code:", err);
      throw err;
    }
  }

  async deleteDiscountCode(id: number) {
    await prisma.discountCode.delete({
      where: { id },
    });
  }
}

export default new DiscountCodeService();
