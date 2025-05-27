import { ApolloError } from 'apollo-server';
import ProductTypesService from './';

const productTypesResolvers = {
  Query: {
    getAllProductTypes: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
    ) => {
      try {
        const { types, totalCount, totalPages, currentPage } = await ProductTypesService.getAllProductTypes( page, limit, search );
        return { types, totalCount, totalPages, currentPage };
      } catch ( error ) {
        console.error( "Error in getAllProductTypes resolver:", error );
        throw new Error( "Failed to retrieve product types" );
      }
    },
  },

  Mutation: {
    createProductType: async ( _: any, { input }: { input: { name: string } } ) => {
      try {
        return await ProductTypesService.createProductType( input.name );
      } catch ( error ) {
        console.error( "Error in createProductType resolver:", error );
        throw new Error( "Failed to create product type" );
      }
    },

    updateProductType: async ( _: any, { id, name }: { id: number; name: string } ) => {
      try {
        return await ProductTypesService.updateProductType( id, name );
      } catch ( error ) {
        console.error( "Error in updateProductType resolver:", error );
        throw new Error( "Failed to update product type" );
      }
    },

    deleteProductType: async ( _: any, { id }: { id: number } ) => {
      try {
        return await ProductTypesService.deleteProductType( id );
      } catch ( error ) {
        console.error( "Error in deleteProductType resolver:", error );
        throw new ApolloError( "Failed to delete product type", "DELETE_FAILED" );
      }
    },
  },
};

export default productTypesResolvers;
