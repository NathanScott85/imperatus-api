import { ApolloError } from 'apollo-server';
import RarityService from './';

const rarityResolvers = {
  Query: {
    getAllRarity: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
    ) => {
      try {
        const { rarities, totalCount, totalPages, currentPage } = await RarityService.getAllRarity(
          page, limit, search
        );
        return {
          rarities,
          totalCount,
          totalPages,
          currentPage
        };
      } catch ( error ) {
        console.error( "Error in getAllRarity resolver:", error );
        throw new Error( "Failed to retrieve rarities" );
      }
    }
  },

  Mutation: {
    createRarity: async ( _: any, { name }: { name: string } ) => {
      try {
        return await RarityService.createRarity( name );
      } catch ( error ) {
        console.error( "Error in createRarity resolver:", error );
        throw new Error( "Failed to create rarity" );
      }
    },

    updateRarity: async ( _: any, { id, name }: { id: number; name: string } ) => {
      try {
        return await RarityService.updateRarity( id, name );
      } catch ( error ) {
        console.error( "Error in updateRarity resolver:", error );
        throw new Error( "Failed to update rarity." );
      }
    }
  }
};

export default rarityResolvers;