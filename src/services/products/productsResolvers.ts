import { ApolloError, AuthenticationError } from 'apollo-server';
import { prisma } from '../../server';
import ProductsService from '../products';
import { isAdminOrOwner } from '../roles/role-checks';

const productResolvers = {
  Query: {
    getAllProducts: async (
      _: unknown,
      {
        page = 1,
        limit = 10,
        search = "",
        filters = {}
      }: {
        page: number;
        limit: number;
        search?: string;
        filters?: {
          brandId?: number;
          setId?: number;
          variantId?: number;
          rarityIds?: number[];
          cardTypeId?: number;
          productTypeId?: number;
          priceMin?: number;
          priceMax?: number;
          preorder?: boolean;
          stockMin?: number;
          stockMax?: number;
        };
      }
    ) => {
      try {
        const { products, totalCount, totalPages, currentPage } = await ProductsService.getAllProducts(
          page, limit, search, filters
        );
        return {
          filters,
          products,
          totalCount,
          totalPages,
          currentPage,
        };
      } catch ( error ) {
        console.error( "Error in getAllProducts resolver:", error );
        throw new Error( "Failed to retrieve products" );
      }
    },

    getAllCardTypes: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string },
    ) => {
      const { cardTypes, totalCount, totalPages, currentPage } = await ProductsService.getAllCardTypes( page, limit, search );
      return {
        cardTypes,
        totalCount,
        totalPages,
        currentPage,
      };
    },

    getAllVariants: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
    ) => {
      try {
        const { variants, totalCount, totalPages, currentPage } = await ProductsService.getAllProductVariants( page, limit, search );
        return {
          variants,
          totalCount,
          totalPages,
          currentPage,
        };
      } catch ( error ) {
        console.error( "Error retrieving product variants:", error );
        throw new Error( "Failed to retrieve product variants" );
      }
    },

    getProductById: async ( _: any, args: { id: string } ) => {
      try {
        return await ProductsService.getProductById( parseInt( args.id ) );
      } catch ( error ) {
        console.error( "Error in product resolver:", error );
        throw new ApolloError( "Failed to retrieve product" );
      }
    },
  },

  Mutation: {
    createVariant: async ( _: any, { name }: { name: string } ) => {
      try {
        return ProductsService.createVariant( name );
      } catch ( error ) {
        console.error( "Error in create variant resolver:", error );
        throw new Error( "Failed to create variant" );
      }
    },

    createCardType: async ( _: any, { name, brandId }: { name: string, brandId: number } ) => {
      try {
        return ProductsService.createCardType( name, brandId );
      } catch ( error ) {
        console.error( "Error in create card type resolver:", error );
        throw new Error( "Failed to create card type" );
      }
    },

    createProduct: async ( _: any, args: any ) => {
      const {
        name,
        price,
        productTypeId,
        description,
        img,
        categoryId,
        brandId,
        stock,
        preorder,
        rrp,
        variantId,
        cardTypeId,
        setId,
      } = args;
      try {
        const newProduct = await ProductsService.createProduct(
          name,
          price,
          productTypeId,
          description,
          img,
          categoryId,
          brandId,
          stock,
          preorder,
          rrp,
          variantId,
          cardTypeId,
          setId,
        );

        return newProduct;
      } catch ( error ) {
        console.error( "Error in createProduct resolver:", error );
        throw new Error( "Failed to create product." );
      }
    },

    updateProduct: async (
      _: any,
      {
        id,
        productTypeId,
        categoryId,
        name,
        price,
        description,
        img,
        stockAmount,
        stockSold,
        stockInstock,
        stockSoldout,
        stockPreorder,
        preorder,
        rrp,
      }: {
        id: string;
        categoryId: number;
        name?: string;
        price?: number;
        productTypeId: number,
        description?: string;
        img?: any;
        stockAmount?: number;
        stockSold?: number;
        stockInstock?: string;
        stockSoldout?: string;
        stockPreorder?: string;
        preorder?: boolean;
        rrp?: number;
      },
      { user }: any
    ): Promise<any> => {
      if ( !user ) {
        throw new AuthenticationError( "You must be logged in" );
      }

      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }

      try {
        const updatedProduct = await ProductsService.updateProduct(
          id,
          productTypeId,
          categoryId,
          name,
          price,
          description,
          img,
          {
            amount: stockAmount,
            sold: stockSold,
            instock: stockInstock,
            soldout: stockSoldout,
            preorder: stockPreorder,
          },
          preorder,
          rrp
        );

        if ( !updatedProduct ) {
          throw new ApolloError( "Product update failed. No product returned." );
        }
        return updatedProduct
      } catch ( error ) {
        console.error( "Error in updateProduct resolver:", error );
        throw new ApolloError( "Failed to update product", "UPDATE_FAILED" );
      }

    },

    async updateVariant( _: any, { id, name }: any ) {
      try {
        return await ProductsService.updateVariant( parseInt( id, 10 ), name );
      } catch ( error ) {
        console.error( "Error in updateVariant resolver:", error );
        throw new Error( "Failed to update variant." );
      }
    },

    updateCardType: async (
      _: any,
      { id, name, brandId }: { id: number; name: string; brandId: number },
      { user }: any
    ) => {
      if ( !user ) {
        throw new AuthenticationError( "You must be logged in" );
      }

      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }

      try {
        const result = await ProductsService.updateCardType( id, name, Number( brandId ) );

        if ( !result ) {
          console.error( "Result is null or undefined, throwing ApolloError." );
          throw new ApolloError( "Failed to update card type - no result returned" );
        }

        return result;
      } catch ( error ) {
        console.error( "Error caught in updateCardType resolver:", error );
        throw new ApolloError( "Failed to update card type", "UPDATE_FAILED" );
      }
    },

    deleteProduct: async (
      _: any,
      args: { id: string },
      { user }: any
    ): Promise<{ message: string }> => {
      if ( !user ) {
        throw new AuthenticationError( "You must be logged in" );
      }

      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }

      try {
        return await ProductsService.deleteProduct( args.id );
      } catch ( error ) {
        console.error( "Error in deleteProduct resolver:", error );
        throw new ApolloError( "Failed to delete product", "DELETE_FAILED" );
      }
    },

    deleteCardType: async (
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
        const result = await ProductsService.deleteCardType( args.id );

        if ( !result ) {
          console.error( "Result is null or undefined, throwing ApolloError." );
          throw new ApolloError( "Failed to delete card type - no result returned" );
        }

        return result;
      } catch ( error ) {
        console.error( "Error caught in deleteCardType resolver:", error );
        throw new ApolloError( "Failed to delete card type", "DELETE_FAILED" );
      }
    }
  },
};

export default productResolvers;
