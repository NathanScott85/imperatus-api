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
    createCarouselPage: async ( _: any, { title, description, img }: any ) => {
      try {
        return await CarouselService.createCarouselPage( title, description, img );
      } catch ( error ) {
        console.error( "Error creating carousel page:", error );
        throw new Error( "Failed to create carousel page." );
      }
    },
  },
};

export default carouselResolvers;
