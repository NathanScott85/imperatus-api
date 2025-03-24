import { prisma } from "../../server";

class CardTypesService {
    public async getAllCardTypes(page: number = 1, limit: number = 10, search: string = "") {
        const offset = (page - 1) * limit;

        const [cardTypes, totalCount] = await Promise.all([
            prisma.cardType.findMany({
                where: search
                    ? { name: { contains: search, mode: "insensitive" } }
                    : undefined,
                skip: offset,
                take: limit,
                include: { brand: true }
            }),
            prisma.cardType.count({
                where: search
                    ? { name: { contains: search, mode: "insensitive" } }
                    : undefined,
            }),
        ]);

        return {
            cardTypes,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
        };
    }

    public async createCardType(name: string, brandId: number) {
        const brand = await prisma.productBrands.findUnique({ where: { id: brandId } });
        if (!brand) throw new Error("Invalid brand. Please select a valid brand.");

        return await prisma.cardType.create({
            data: { name, brandId },
            include: { brand: true }
        });
    }

    public async updateCardType(id: number, name: string, brandId: number) {
        const cardType = await prisma.cardType.findUnique({ where: { id } });
        if (!cardType) throw new Error("Card type not found.");

        const brand = await prisma.productBrands.findUnique({ where: { id: brandId } });
        if (!brand) throw new Error("Invalid brand. Please select a valid brand.");

        return await prisma.cardType.update({
            where: { id },
            data: { name, brandId }
        });
    }

    public async deleteCardType(id: string): Promise<{ success: boolean; message: string }> {
        const existing = await prisma.cardType.findUnique({ where: { id: parseInt(id) } });
        if (!existing) throw new Error("Card type not found.");

        await prisma.cardType.delete({ where: { id: parseInt(id) } });

        return { success: true, message: "Card type deleted successfully." };
    }
}

export default new CardTypesService();
