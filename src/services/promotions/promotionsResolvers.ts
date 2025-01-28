import PromotionsService from '../promotions';

const promotionResolvers = {
  Query: {
    getAllPromotions: async (
      _: unknown,
      { page = 1, limit = 10 }: { page: number; limit: number },
    ) => {
      try {
        const { promotions, totalCount, totalPages, currentPage } = await PromotionsService.getAllPromotions( page, limit );
        return {
          promotions: promotions || [],
          totalCount,
          totalPages,
          currentPage,
        };
      } catch ( error ) {
        console.error( "Error in getAllPromotions resolver:", error );
        throw new Error( "Failed to retrieve promotions" );
      }
    },
  },
};

export default promotionResolvers;
