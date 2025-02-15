import { ApolloError, AuthenticationError } from 'apollo-server';
import { prisma } from '../../server';
import ProductsService from '../products';
import { isAdminOrOwner } from '../roles/role-checks';

const productResolvers = {
  Query: {
    getAllProducts: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
    ) => {
      try {
        const { products, totalCount, totalPages, currentPage } = await ProductsService.getAllProducts( page, limit, search );
        return {
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

    getAllProductTypes: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string },
    ) => {
      const { types, totalCount, totalPages, currentPage } = await ProductsService.getAllProductTypes( page, limit, search );
      return {
        types,
        totalCount,
        totalPages,
        currentPage,
      };
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

    getAllBrands: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string } ) => {
      const { brands, totalCount, totalPages, currentPage } = await ProductsService.getAllBrands( page, limit, search );
      return {
        brands,
        totalCount,
        totalPages,
        currentPage
      }
    },

    getAllSets: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string } ) => {
      const { sets, totalCount, totalPages, currentPage } = await ProductsService.getAllProductSets( page, limit, search );
      return {
        sets,
        totalCount,
        totalPages,
        currentPage
      }
    },

    getAllRarity: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string } ) => {
      const { rarities, totalCount, totalPages, currentPage } = await ProductsService.getAllRarity( page, limit, search );
      return {
        rarities,
        totalCount,
        totalPages,
        currentPage
      }
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
    createProductType: async ( _: any, { input }: { input: { name: string } } ) => {
      try {
        const existingType = await prisma.productType.findUnique( {
          where: { name: input.name },
        } );

        if ( existingType ) {
          throw new Error( "Product type already exists." );
        }

        return await prisma.productType.create( {
          data: { name: input.name },
        } );

      } catch ( error ) {
        console.error( "Error creating product type:", error );
        throw new Error( "An unexpected error occurred while creating the product type." );
      }
    },

    createProductBrand: async ( _: any, { name, description, img }: any ) => {
      try {
        return ProductsService.createProductBrand( name, description, img );
      } catch ( error ) {
        console.error( "Error in createProduct resolver:", error );
        throw new Error( "Failed to create product." );
      }
    },

    createProductSet: async ( _: any, { setName, setCode, description }: any ) => {
      try {
        return ProductsService.createProductSet( setName, setCode, description )
      } catch ( error ) {
        console.error( "Error in createProduct resolver:", error );
        throw new Error( "Failed to create product set" );
      }
    },

    createRarity: async ( _: any, { name }: { name: string } ) => {
      try {
        return ProductsService.createRarity( name );
      } catch ( error ) {
        console.error( "Error in createRarity resolver:", error );
        throw new Error( "Failed to create rarity" );
      }
    },

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
        setId,
        stock,
        preorder,
        rrp,
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
          setId,
          stock,
          preorder,
          rrp
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

    async updateProductBrand( _: any, { id, name, description, img }: any ) {
      try {
        return await ProductsService.updateProductBrand( parseInt( id, 10 ), name, description, img );
      } catch ( error ) {
        console.error( "Error in updateProductBrand resolver:", error );
        throw new Error( "Failed to update product brand." );
      }
    },

    async updateProductSet( _: any, { id, setName, setCode, description, }: any ) {
      try {
        return await ProductsService.updateProductSet( parseInt( id, 10 ), setName, setCode, description );
      } catch ( error ) {
        console.error( "Error in updateProductBrand resolver:", error );
        throw new Error( "Failed to update product brand." );
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

    async updateProductType( _: any, { id, name }: { id: number; name: string } ) {
      try {
        return await ProductsService.updateProductType( id, name );
      } catch ( error ) {
        console.error( "Error in updateProductType resolver:", error );
        throw new Error( "Failed to update product type." );
      }
    },

    async updateRarity( _: any, { id, name }: { id: number; name: string } ) {
      try {
        return await ProductsService.updateRarity( id, name );
      } catch ( error ) {
        console.error( "Error in updateRarity resolver:", error );
        throw new Error( "Failed to update rarity." );
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
        console.log( "Received ID in resolver:", typeof id, id );
        console.log( "Received brandId in resolver:", typeof brandId, brandId );
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

    deleteBrand: async (
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
        return await ProductsService.deleteBrand( args.id );
      } catch ( error ) {
        console.error( "Error in deleteBrand resolver:", error );
        throw new ApolloError( "Failed to delete brand", "DELETE_FAILED" );
      }
    },

    deleteSet: async (
      _: any,
      args: { id: string },
      { user }: any
    ): Promise<{ message: string }> => {

      if ( !user ) {
        console.log( "No user found in context. Throwing AuthenticationError." );
        throw new AuthenticationError( "You must be logged in" );
      }

      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }

      try {
        const result = await ProductsService.deleteSet( args.id );

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

    deleteCardType: async (
      _: any,
      args: { id: string },
      { user }: any
    ): Promise<{ message: string }> => {

      if ( !user ) {
        console.log( "No user found in context. Throwing AuthenticationError." );
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
