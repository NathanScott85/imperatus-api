import { ApolloError, AuthenticationError } from 'apollo-server';
import BrandsService from '../brands';
import { isAdminOrOwner } from '../roles/role-checks';

const brandsResolvers = {
  Query: {
    getAllBrands: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
    ) => {
      try {
        const { brands, totalCount, totalPages, currentPage } = await BrandsService.getAllBrands( page, limit, search );
        return {
          brands,
          totalCount,
          totalPages,
          currentPage
        };
      } catch ( error ) {
        console.error( "Error in getAllBrands resolver:", error );
        throw new Error( "Failed to retrieve brands" );
      }
    },
    getBrandsByCategory: async (_: any, args: { categoryId: number }) => {
      return BrandsService.getBrandsByCategory(args.categoryId);
  },
  },

  Mutation: {
    createProductBrand: async ( _: any, { name, description, img }: any ) => {
      try {
        return await BrandsService.createProductBrand( name, description, img );
      } catch ( error ) {
        console.error( "Error in createBrand resolver:", error );
        throw new Error( "Failed to create brand." );
      }
    },

    updateProductBrand: async ( _: any, { id, name, description, img }: any ) => {
      try {
        return await BrandsService.updateProductBrand( parseInt( id, 10 ), name, description, img );
      } catch ( error ) {
        console.error( "Error in updateBrand resolver:", error );
        throw new Error( "Failed to update brand." );
      }
    },

    deleteBrand: async ( _: any, { id }: { id: string }, { user }: any ) => {
      if ( !user ) {
        throw new AuthenticationError( "You must be logged in" );
      }
      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }
      try {
        return await BrandsService.deleteBrand( id );
      } catch ( error ) {
        console.error( "Error in deleteBrand resolver:", error );
        throw new ApolloError( "Failed to delete brand", "DELETE_FAILED" );
      }
    },
  },
};

export default brandsResolvers;