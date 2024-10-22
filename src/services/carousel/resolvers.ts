import { ApolloError } from "apollo-server";
import { prisma } from "../../server";
import UploadService from "../upload"; // Upload service for handling file uploads (e.g., S3 or local storage)

const carouselResolvers = {
  Mutation: {
      createCarouselItem: async (
          _: any,
          {
              title,
              description,
              image,
              logo,
              isActive,
          }: {
              title: string;
              description: string;
              image: any;
              logo: any;
              isActive: boolean;
          }
      ) => {
          try {
              let fileRecord = null;
              let logoFileRecord = null

              if (!fileRecord) {
                throw new Error("Carousel image upload failed");
            }
            
            if (!logoFileRecord) {
                throw new Error("Logo upload failed");
            }
            console.debug(title, 'title');
              if (image) {
                  const { createReadStream, filename, mimetype } = await image;
                  const stream = createReadStream();
                  const { s3Url, key, fileName, contentType } =
                      await UploadService.processUpload(stream, filename, mimetype);

                  fileRecord = await prisma.file.create({
                      data: { url: s3Url, key, fileName, contentType },
                  });
           
              }

              if (logo) {
                  const { createReadStream, filename, mimetype } = await logo;
                  const stream = createReadStream();
                  const { s3Url, key, fileName, contentType } =
                      await UploadService.processUpload(stream, filename, mimetype);

                  logoFileRecord = await prisma.file.create({
                      data: { url: s3Url, key, fileName, contentType },
                  });
             
              }

              const newItem = await prisma.carouselItem.create({
                data: {
                    title,
                    description,
                    isActive,
                    imageId: fileRecord?.id ?? null, // Add this line
                    logoId: logoFileRecord?.id ?? null, // Add this line
                },
            });


              return newItem;
          } catch (error) {
              console.error("Error creating carousel item:", error);
              throw new ApolloError("Failed to create carousel item");
          }
      },
  },
};



export default carouselResolvers;
