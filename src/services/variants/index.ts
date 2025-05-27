import { prisma } from "../../server";
import { Prisma } from "@prisma/client";

class VariantsService {
    public async getAllProductVariants(page: number = 1, limit: number = 10, search: string = "") {
        const offset = (page - 1) * limit;

        const [variants, totalCount] = await Promise.all([
            prisma.productVariant.findMany({
                where: search
                    ? {
                          name: {
                              contains: search,
                              mode: "insensitive",
                          },
                      }
                    : undefined,
                skip: offset,
                take: limit,
            }),
            prisma.productVariant.count({
                where: search
                    ? {
                          name: {
                              contains: search,
                              mode: "insensitive",
                          },
                      }
                    : undefined,
            }),
        ]);

        return {
            variants,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
        };
    }

    public async createVariant(name: string) {
        try {
            return await prisma.productVariant.create({ data: { name } });
        } catch (error) {
            console.error("Error creating variant:", error);
            throw new Error("Failed to create variant");
        }
    }

    public async updateVariant(id: number, name: string) {
        try {
            return await prisma.productVariant.update({
                where: { id },
                data: { name },
            });
        } catch (error: any) {
            console.error("Error in updateVariant method:", error);

            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025"
            ) {
                throw new Error("Variant not found.");
            }

            throw new Error("An unexpected error occurred while updating the variant.");
        }
    }
}

export default new VariantsService();
