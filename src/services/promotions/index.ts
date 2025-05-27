import { Prisma } from '@prisma/client';
import moment from "moment";
import { prisma } from "../../server";
import { formatSlug } from '../../lib';
import UploadService from '../upload';

class PromotionService {
  public async getAllPromotions( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const whereCondition: Prisma.PromotionWhereInput = search
        ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
        : {};

      const [promotions, totalCount] = await Promise.all( [
        prisma.promotion.findMany( {
          where: whereCondition,
          skip: offset,
          take: limit,
          orderBy: { startDate: "desc" },
        } ),
        prisma.promotion.count( { where: whereCondition } ),
      ] );

      const formattedPromotions = promotions.map( ( promotion ) => ( {
        ...promotion,
        startDate: moment( promotion.startDate ).format( "YYYY-MM-DD" ),
        endDate: moment( promotion.endDate ).format( "YYYY-MM-DD" ),
      } ) );

      return {
        promotions: formattedPromotions,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error in getAllPromotions:", error );
      throw new Error( "Failed to retrieve promotions" );
    }
  }

  public async createPromotion(
    title: string,
    description: string,
    img: any,
    startDate: string,
    endDate: string
  ) {
    try {
      const existingPromotion = await prisma.promotion.findFirst( {
        where: { title: title.toLowerCase() },
      } );

      if ( existingPromotion ) {
        throw new Error( "A promotion with this title already exists. Please choose a different title." );
      }

      const promotion = await prisma.promotion.create( {
        data: {
          title,
          description,
          startDate: new Date( startDate ),
          endDate: new Date( endDate ),
        },
      } );

      const slug = `promotion/${promotion.id}/${formatSlug( title )}`;

      const updatedPromotion = await prisma.promotion.update( {
        where: { id: promotion.id },
        data: {
          slug,
        },
      } );

      let fileRecord = null;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } = await UploadService.processUpload( stream, filename, mimetype );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );

        await prisma.promotion.update( {
          where: { id: updatedPromotion.id },
          data: {
            imgId: fileRecord.id,
          },
        } );
      }

      return {
        ...updatedPromotion,
        img: fileRecord ? fileRecord.url : null,
      };
    } catch ( error ) {
      console.error( "Error in createPromotion:", error );
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error( "A promotion with this title already exists. Please choose a different title." );
      }

      throw new Error( "An unexpected error occurred while creating the promotion. Please try again." );
    }
  }

  public async updatePromotion(
    id: number,
    title: string,
    description: string,
    img: any,
    startDate: string,
    endDate: string
  ) {
    try {
      const existingPromotion = await prisma.promotion.findUnique( {
        where: { id },
        include: { img: true },
      } );

      if ( !existingPromotion ) {
        throw new Error( "Promotion not found." );
      }

      const slug = `promotion/${id}/${formatSlug( title )}`;

      let fileRecord = existingPromotion.img;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } = await UploadService.processUpload( stream, filename, mimetype );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );

        await prisma.promotion.update( {
          where: { id },
          data: {
            imgId: fileRecord.id,
          },
        } );
      }

      const updatedPromotion = await prisma.promotion.update( {
        where: { id },
        data: {
          title,
          description,
          slug,
          startDate: new Date( startDate ),
          endDate: new Date( endDate ),
        },
      } );

      return {
        ...updatedPromotion,
        img: fileRecord ? fileRecord.url : null,
      };
    } catch ( error ) {
      console.error( "Error in updatePromotion:", error );
      throw new Error( "Failed to update promotion." );
    }
  }

  public async deletePromotion( id: number ): Promise<boolean> {
    try {
      const existingPromotion = await prisma.promotion.findUnique( {
        where: { id },
      } );

      if ( !existingPromotion ) {
        throw new Error( "Promotion not found." );
      }

      if ( existingPromotion.imgId ) {
        await prisma.file.delete( {
          where: { id: existingPromotion.imgId },
        } );
      }

      await prisma.promotion.delete( {
        where: { id },
      } );

      return true;
    } catch ( error ) {
      console.error( "Error in deletePromotion:", error );
      throw new Error( "Failed to delete promotion." );
    }
  }
}

export default new PromotionService();
