import { prisma } from "../../server";
import UploadService from "../upload";

class CarouselService {
  public async getCarouselPages() {
    return await prisma.carouselPages.findMany( {
      include: {
        pages: {
          include: {
            img: true,
            brand: {
              include: {
                img: true
              }
            }
          },
        },
      },
    } );
  }

  public async createCarouselPage(
    title: string,
    description: string | null,
    img: any,
    brandId?: number
  ): Promise<any> {
    try {
      let fileRecord = null;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const {
          s3Url,
          key,
          fileName,
          contentType,
        } = await UploadService.processUpload( stream, filename, mimetype );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );
      }

      let existingBrand = null;
      if ( brandId ) {
        existingBrand = await prisma.productBrands.findUnique( {
          where: { id: brandId },
        } );

        if ( !existingBrand ) {
          throw new Error( "Invalid brand. Please select a valid brand." );
        }
      }

      let parentPage = await prisma.carouselPages.findFirst();

      if ( !parentPage ) {
        parentPage = await prisma.carouselPages.create( {
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } );
      }

      const carouselPage = await prisma.carouselPage.create( {
        data: {
          title,
          description: description || null,
          carouselPageId: parentPage.id,
          imgId: fileRecord?.id || null,
          brandId: existingBrand?.id || null,
        },
        include: {
          img: true,
          brand: true,
        },
      } );

      return {
        ...carouselPage,
        img: fileRecord,
      };
    } catch ( error ) {
      console.error( "Error creating carousel page:", error );
      throw new Error(
        "An unexpected error occurred while creating the carousel page. Please try again."
      );
    }
  }


  public async updateCarouselPage(
    id: string,
    title?: string,
    description?: string | null,
    img?: any,
    brandId?: number
  ): Promise<any> {
    try {
      const existingCarouselPage = await prisma.carouselPage.findUnique( {
        where: { id },
      } );

      if ( !existingCarouselPage ) {
        throw new Error( "Carousel page not found." );
      }

      if ( brandId ) {
        const existingBrand = await prisma.productBrands.findUnique( {
          where: { id: Number( brandId ) },
        } );

        if ( !existingBrand ) {
          throw new Error( "Invalid brand. Please select a valid brand." );
        }
      }

      let fileRecord = null;
      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const {
          s3Url,
          key,
          fileName,
          contentType,
        } = await UploadService.processUpload( stream, filename, mimetype );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );
      }

      const updatedCarouselPage = await prisma.carouselPage.update( {
        where: { id },
        data: {
          title: title !== undefined ? title : existingCarouselPage.title,
          description: description !== undefined ? description : existingCarouselPage.description,
          brandId: brandId !== undefined ? Number( brandId ) : existingCarouselPage.brandId,
          imgId: fileRecord ? fileRecord.id : existingCarouselPage.imgId,
          updatedAt: new Date(),
        },
        include: {
          img: true,
          brand: true,
        },
      } );

      return {
        ...updatedCarouselPage,
        img: fileRecord ||
          ( updatedCarouselPage.imgId
            ? await prisma.file.findUnique( {
              where: { id: updatedCarouselPage.imgId },
            } )
            : null ),
      };
    } catch ( error ) {
      console.error( "Error updating carousel page:", error );
      throw new Error( "An unexpected error occurred while updating the carousel page. Please try again." );
    }
  }

  public async deleteCarouselPage( id: string ): Promise<any> {
    try {

      const existingCarouselPage = await prisma.carouselPage.findUnique( {
        where: { id },
      } );

      if ( !existingCarouselPage ) {
        throw new Error( "Carousel page not found." );
      }

      if ( existingCarouselPage.imgId ) {
        await prisma.file.delete( {
          where: { id: existingCarouselPage.imgId },
        } );
      }

      const deletedCarouselPage = await prisma.carouselPage.delete( {
        where: { id },
      } );

      return {
        message: "Carousel page deleted successfully.",
        deletedPage: deletedCarouselPage,
      };
    } catch ( error ) {
      console.error( "Error deleting carousel page:", error );
      throw new Error( "An unexpected error occurred while deleting the carousel page. Please try again." );
    }
  }

}

export default new CarouselService();
