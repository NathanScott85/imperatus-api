import { ApolloError } from 'apollo-server';
import CarouselService from ".";

const carouselResolvers = {
  Query: {
    getCarouselPages: async () => {
      try {
        return await CarouselService.getCarouselPages();
      } catch ( error ) {
        console.error( "Error fetching carousel pages:", error );
        throw new Error( "Failed to fetch carousel pages." );
      }
    },
  },
  Mutation: {
    createCarouselPage: async ( _: any, { title, description, img, brandId }: any ) => {
      try {
        return await CarouselService.createCarouselPage( title, description, img, brandId );
      } catch ( error ) {
        console.error( "Error creating carousel page:", error );
        throw new Error( "Failed to create carousel page." );
      }
    },
    updateCarouselPage: async (
      _: any,
      args: {
        id: string;
        title?: string;
        description?: string;
        img?: any;
        brandId?: number;
      },
    ) => {
      const { id, title, description, img, brandId } = args;

      try {
        const updatedCarouselPage = await CarouselService.updateCarouselPage(
          id,
          title,
          description,
          img,
          brandId
        );

        return updatedCarouselPage;
      } catch ( error ) {
        console.error( "Error updating carousel page:", error );

        if ( error instanceof Error ) {
          throw new Error(
            error.message || "An unexpected error occurred while updating the carousel page."
          );
        } else {
          throw new Error( "An unexpected error occurred while updating the carousel page." );
        }
      }
    },
    deleteCarouselPage: async ( _: any, args: any ) => {
      const { id } = args;
      try {
        const result = await CarouselService.deleteCarouselPage( id );
        return result;
      } catch ( error ) {
        console.error( "Error deleting carousel page:", error );
        throw new ApolloError( "Failed to delete carousel page." );
      }
    },
  },
};

export default carouselResolvers;
