import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import { AuthenticationError } from 'apollo-server';
import { isAdminOrOwner } from '../roles/role-checks';

class ProductTypesService {
  public async getAllProductTypes( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [types, totalCount] = await Promise.all( [
        prisma.productType.findMany( {
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
          skip: offset,
          take: limit,
        } ),
        prisma.productType.count( {
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
        } ),
      ] );

      return {
        types,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving product types:", error );
      throw new Error( "Failed to retrieve product types" );
    }
  }

  async createProductType( name: string ) {
    const existingType = await prisma.productType.findUnique( {
      where: { name },
    } );

    if ( existingType ) {
      throw new Error( "Product type already exists." );
    }

    return await prisma.productType.create( {
      data: { name },
    } );
  }

  public async updateProductType( id: number, name: string ) {
    try {
      const existingType = await prisma.productType.findUnique( { where: { id } } );
      if ( !existingType ) throw new Error( "Product type not found." );
      return await prisma.productType.update( { where: { id }, data: { name } } );
    } catch ( error ) {
      console.error( "Error updating product type:", error );
      throw new Error( "Failed to update product type" );
    }
  }
  public async deleteProductType( id: number, user: any ) {
    if ( !user ) {
      throw new AuthenticationError( "You must be logged in" );
    }
    if ( !isAdminOrOwner( user ) ) {
      throw new AuthenticationError( "Permission denied" );
    }
    try {
      const existingType = await prisma.productType.findUnique( { where: { id } } );
      if ( !existingType ) throw new Error( "Product type not found." );

      await prisma.productType.delete( { where: { id } } );
      return { message: "Product type deleted successfully" };
    } catch ( error ) {
      console.error( "Error deleting product type:", error );
      throw new Error( "Failed to delete product type" );
    }
  }

}

export default new ProductTypesService();
