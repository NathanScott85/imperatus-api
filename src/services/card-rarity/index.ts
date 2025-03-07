import { prisma } from "../../server";

class RarityService {
  public async getAllRarity( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [rarities, totalCount] = await Promise.all( [
        prisma.rarity.findMany( {
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
        prisma.rarity.count( {
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
        rarities,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving rarities:", error );
      throw new Error( "Failed to retrieve rarities" );
    }
  }

  public async createRarity( name: string ) {
    try {
      return await prisma.rarity.create( {
        data: {
          name,
        },
      } );
    } catch ( error ) {
      console.error( "Error creating rarity:", error );
      throw new Error( "Failed to create rarity" );
    }
  }

  public async updateRarity( id: number, name: string ): Promise<any> {
    try {
      const existingRarity = await prisma.rarity.findUnique( {
        where: { id },
      } );

      if ( !existingRarity ) {
        throw new Error( "Rarity not found." );
      }

      return await prisma.rarity.update( {
        where: { id },
        data: { name },
      } );
    } catch ( error ) {
      console.error( "Error updating rarity:", error );
      throw new Error( "An unexpected error occurred while updating the rarity." );
    }
  }
}

export default new RarityService();
