import { AuthenticationError } from "apollo-server";
import { prisma } from "../../server";
import CategoriesService from "../categories";
import { isAdminOrOwner } from "../roles/role-checks";


const categoriesResolvers = {
  Category: {
    products: async ( parent: any ) => {
      return await prisma.product.findUnique( {
        where: { id: parent.categoryId },
      } );
    },
    stock: async ( parent: any ) => {
      return await prisma.stock.findUnique( {
        where: { productId: parent.id },
      } );
    },
    img: async ( parent: any ) => {
      return await prisma.file.findUnique( {
        where: { id: parent.imgId },
      } );
    },
    type: async ( parent: any ) => {
      return await prisma.categoryType.findUnique( {
        where: { id: parent.categoryTypeId },
      } )
    }
  },
  Query: {
    getAllCategories: async (
      _: any,
      { page = 1, limit = 10, search = "", filters }:
        { page: number; limit: number; search?: string; filters?: any }
    ) => {
      const { categories, totalCount, totalPages, currentPage } =
        await CategoriesService.getAllCategories( page, limit, search, filters );

      return {
        categories,
        totalCount,
        totalPages,
        currentPage,
        filters,
      };
    },
    getAllCategoryTypes: async () => {
      return await CategoriesService.getAllCategoryTypes();
    },
    getCategoryById: async ( _: any, { id, page, limit }: any ) => {
      return await CategoriesService.getCategoryById( id, page, limit );
    },
    getCategoryTypeById: async ( _: any, args: any ) => {
      return await CategoriesService.getCategoryById( args.id )
    },
    getCategoryByName: async ( _: any, args: { name: string } ) => {
      try {
        const category = await CategoriesService.getCategoryByName( args.name );

        if ( !category ) {
          throw new Error( `Category with name "${args.name}" not found` );
        }

        return category;
      } catch ( error ) {
        const errorMessage = ( error as Error ).message;
        console.error( "Failed to retrieve category by name:", errorMessage );
        throw new Error( "Failed to retrieve category by name" );
      }
    },
  },
  Mutation: {
    createCategory: async ( _: any, { name, description, img }: any ) => {
      return await CategoriesService.createCategory( name, description, img );
    },
    createCategoryType: async ( _: any, { input }: { input: { name: string } } ) => {
      try {
        const existingType = await prisma.categoryType.findUnique( {
          where: { name: input.name },
        } );

        if ( existingType ) {
          throw new Error( "Product type already exists." );
        }

        return await prisma.categoryType.create( {
          data: { name: input.name },
        } );

      } catch ( error ) {
        console.error( "Error creating product type:", error );
        throw new Error( "An unexpected error occurred while creating the product type." );
      }
    },
    deleteCategory: async (
      _: unknown,
      args: { id: string },
      context: any
    ): Promise<{ message: string }> => {
      const { id } = args;
      const requestingUserId = context.user.id;

      try {
        const requestingUser = await prisma.user.findUnique( {
          where: { id: requestingUserId },
          include: { userRoles: { include: { role: true } } },
        } );

        if ( !requestingUser ) {
          throw new AuthenticationError( "You must be logged in" );
        }

        const roles = requestingUser.userRoles.map(
          ( userRole ) => userRole.role.name
        );

        if ( !roles.includes( "OWNER" ) ) {
          throw new AuthenticationError(
            "You do not have permission to delete this category"
          );
        }
        return await CategoriesService.deleteCategory( id );
      } catch ( error ) {
        console.error( "Error in deleteCategory resolver:", error );
        throw error;
      }
    },
    updateCategory: async (
      _: any,
      {
        id,
        name,
        description,
        img,
      }: { id: string; name?: string; description?: string; img?: any },
      context: any
    ) => {
      const { user } = context;

      if ( !user ) {
        throw new AuthenticationError( "Authentication required" );
      }

      if ( !isAdminOrOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }

      return await CategoriesService.updateCategory( id, name, description, img );
    },
  },
};

export default categoriesResolvers;
