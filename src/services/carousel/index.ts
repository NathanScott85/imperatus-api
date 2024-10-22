// services/carouselService.ts
import UploadService from "../upload"; // Adjust the import according to your project structure
import { prisma } from "../../server";

class CarouselService {
  public async createCarouselItem(
    title: string,
    img: any,
    logo: any,
    description?: string,
    isActive: boolean = false
  ): Promise<any> {
    try {
      let carouselImageRecord = null;
      let logoRecord = null;
      let imgURL = null;
      let imgKey = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload(stream, filename, mimetype);
          imgURL = s3Url
          imgKey = key;
        carouselImageRecord = await prisma.file.create({
          data: {
            url: imgURL,
            key: imgKey,
            fileName,
            contentType,
          },
        });
      }

      // Handle logo upload
      if (logo) {
        const { createReadStream, filename, mimetype } = await logo;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload(stream, filename, mimetype);

          imgURL = s3Url
          imgKey = key;

        logoRecord = await prisma.file.create({
          data: {
            url: imgURL,
            key: imgKey,
            fileName,
            contentType,
          },
        });
      }

      if (!carouselImageRecord || !logoRecord) {
        throw new Error("Both carousel image and logo are required.");
      }

      const carouselItem = await prisma.carouselItem.create({
        data: {
          title,
          description,
          isActive,
        },
        include: {
          img: true,
          logo: true,
        },
      });

      if (!carouselItem || !carouselItem.id) {
        console.error("Failed to create carousel item in database");
        throw new Error("Failed to create carousel item");
      }

      return {
        ...carouselItem,
        img: carouselImageRecord,
        logo: logoRecord,
      };
    } catch (error) {
      console.error("Error in createCarouselItem method:", error);
      throw new Error(
        "An unexpected error occurred while creating the carousel item. Please try again."
      );
    }
  }
}

export default new CarouselService();
