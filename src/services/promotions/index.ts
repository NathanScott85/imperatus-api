import { Prisma } from '@prisma/client';
import { prisma } from "../../server";

class PromotionService {
  public async getAllPromotions( page: number = 1, limit: number = 10 ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [promotions, totalCount] = await Promise.all( [
        prisma.promotion.findMany( {
          skip: offset,
          take: limit,
          orderBy: {
            startDate: 'desc',
          },
        } ),
        prisma.promotion.count(),
      ] );

      return {
        promotions,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error in getAllPromotions:", error );
      throw new Error( "Failed to retrieve promotions" );
    }
  }

}

export default new PromotionService();