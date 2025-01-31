import PromotionsService from '../promotions';

const promotionResolvers = {
  Query: {
    getAllPromotions: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search: string }
    ) => {
      try {
        return await PromotionsService.getAllPromotions( page, limit, search );
      } catch ( error ) {
        console.error( "Error in getAllPromotions resolver:", error );
        throw new Error( "Failed to retrieve promotions" );
      }
    },
  },
  Mutation: {
    createPromotion: async (
      _: unknown,
      { title, description, img, startDate, endDate }:
        { title: string; description: string; img: any; startDate: string; endDate: string }
    ) => {
      try {
        return await PromotionsService.createPromotion( title, description, img, startDate, endDate );
      } catch ( error ) {
        console.error( "Error in createPromotion resolver:", error );
        throw new Error( "Failed to create promotion" );
      }
    },
    updatePromotion: async (
      _: unknown,
      { id, title, description, img, startDate, endDate }:
        { id: number; title: string; description: string; img: any; startDate: string; endDate: string }
    ) => {
      try {
        return await PromotionsService.updatePromotion( Number( id ), title, description, img, startDate, endDate );
      } catch ( error ) {
        console.error( "Error in updatePromotion resolver:", error );
        throw new Error( "Failed to update promotion" );
      }
    },
    deletePromotion: async ( _: unknown, { id }: { id: number } ) => {
      try {
        return await PromotionsService.deletePromotion( Number( id ) );
      } catch ( error ) {
        console.error( "Error in deletePromotion resolver:", error );
        throw new Error( "Failed to delete promotion" );
      }
    },
  },
};

export default promotionResolvers;
