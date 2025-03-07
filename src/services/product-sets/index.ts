import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import { ApolloError } from 'apollo-server';

class ProductSetsService {
  public async getAllProductSets( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [sets, totalCount] = await Promise.all( [
        prisma.productSet.findMany( {
          where: search
            ? {
              setName: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
          include: {
            brand: true,
          },
          skip: offset,
          take: limit,
        } ),
        prisma.productSet.count( {
          where: search
            ? {
              setName: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
        } ),
      ] );

      return {
        sets,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving product sets", error );
      throw new Error( `Unable to fetch sets, ${error}` );
    }
  }

  public async createProductSet( setName: string, setCode: string, description: string, brandId: number ): Promise<any> {
    try {
      if ( !setName ) throw new Error( "Set name is required" );

      const existingSet = await prisma.productSet.findUnique( {
        where: { setName },
      } );

      if ( existingSet ) {
        throw new Error( "Product set already exists. Please choose a different name" );
      }

      return await prisma.productSet.create( {
        data: {
          setName,
          setCode,
          description,
          brandId,
        },
        include: {
          brand: true,
        },
      } );
    } catch ( error ) {
      console.error( "Error in createProductSet method:", error );
      throw new Error( "An unexpected error occurred while creating the product set. Please try again." );
    }
  }

  public async updateProductSet( id: number, setName: string, setCode: string, description: string, brandId: number ): Promise<any> {
    try {
      const existingSet = await prisma.productSet.findUnique( {
        where: { id },
      } );

      if ( !existingSet ) {
        throw new Error( "Product set not found." );
      }

      return await prisma.productSet.update( {
        where: { id },
        data: {
          setName,
          setCode,
          description: description ?? undefined,
          brand: {
            connect: { id: brandId },
          },
        },
        include: {
          brand: true,
        },
      } );
    } catch ( error ) {
      console.error( "Error in updateProductSet method:", error );
      throw new Error( "An unexpected error occurred while updating the product set." );
    }
  }

  public async deleteSet( id: string ) {
    try {
      const set = await prisma.productSet.findUnique( {
        where: { id: parseInt( id ) },
      } );
      if ( !set ) {
        throw new ApolloError(
          `Set with ID ${id} does not exist`,
          "SET_NOT_FOUND"
        );
      }

      await prisma.productSet.delete( {
        where: { id: parseInt( id ) },
      } );

      return { message: "Set deleted successfully" };
    } catch ( error ) {
      console.error( "Error in deleteSet method:", error );
      throw new ApolloError( "Failed to delete set", "DELETE_FAILED" );
    }
  }
}

export default new ProductSetsService();
