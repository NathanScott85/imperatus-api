import { prisma } from "../../server";
import UploadService from "../upload";

class CarouselService {
  public async getCarouselPages() {
    return await prisma.carouselPages.findMany( {
      include: {
        pages: {
          include: {
            img: true,
          },
        },
      },
    } );
  }

  public async createCarouselPage( title: string, description: string, img: any ) {
    try {
      let fileRecord = null;

      // Process the image if provided
      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } = await UploadService.processUpload(
          stream,
          filename,
          mimetype
        );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );
      }

      // Fetch the parent CarouselPages record, or create one if it doesn't exist
      let parentPage = await prisma.carouselPages.findFirst();

      if ( !parentPage ) {
        console.log( 'No parent record found. Creating a new parent record...' );
        parentPage = await prisma.carouselPages.create( {
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } );
      }

      // Create the CarouselPage and associate it with the parent
      const carouselPage = await prisma.carouselPage.create( {
        data: {
          title,
          description,
          carouselPageId: parentPage.id, // Associate with the parent
          ...( fileRecord && { imgId: fileRecord.id } ),
        },
      } );

      return carouselPage;
    } catch ( error ) {
      console.error( "Error creating carousel page:", error );
      throw new Error( "Failed to create carousel page." );
    }
  }

}

export default new CarouselService();
