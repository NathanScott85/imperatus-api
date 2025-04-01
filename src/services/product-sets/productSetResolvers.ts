import { ApolloError, AuthenticationError } from 'apollo-server';
import ProductSetsService from "./";
import { isAdminOrOwner } from '../roles/role-checks';

const productSetResolvers = {
  Query: {
    getAllSets: async ( _: any, { page, limit, search }: any ) => {
      return await ProductSetsService.getAllProductSets( page, limit, search );
    },
    getSetsByCategory: async (_: any, args: { categoryId: number }) => {
      return ProductSetsService.getSetsByCategory(args.categoryId);
    },
  },
  Mutation: {
    createProductSet: async ( _: any, { setName, setCode, description, brandId }: any ) => {
      try {
        if ( !brandId ) {
          throw new Error( "Brand ID is required" );
        }

        return await ProductSetsService.createProductSet( setName, setCode, description, brandId );
      } catch ( error ) {
        console.error( "Error in createProductSet resolver:", error );
        throw new Error( "Failed to create product set" );
      }
    },


    async updateProductSet( _: any, { id, setName, setCode, description, brandId }: any ) {
      try {
        return await ProductSetsService.updateProductSet(
          parseInt( id, 10 ),
          setName,
          setCode,
          description,
          brandId
        );
      } catch ( error ) {
        console.error( "Error in updateProductSet resolver:", error );
        throw new Error( "Failed to update product set." );
      }
    },

    deleteSet: async (
      _: any,
      args: { id: string },
      { user }: any
    ): Promise<{ message: string }> => {

      if ( !user ) {
        console.error( "No user found in context. Throwing AuthenticationError." );
        throw new AuthenticationError( "You must be logged in" );
      }

      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }

      try {
        const result = await ProductSetsService.deleteSet( args.id );

        if ( !result ) {
          console.error( "Result is null or undefined, throwing ApolloError." );
          throw new ApolloError( "Failed to delete set - no result returned" );
        }
        return result;
      } catch ( error ) {
        console.error( "Error caught in deleteSet resolver:", error );
        throw new ApolloError( "Failed to delete set", "DELETE_FAILED" );
      }
    },


  },
};

export default productSetResolvers;
