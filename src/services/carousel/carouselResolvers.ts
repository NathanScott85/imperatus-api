import { ApolloError } from "apollo-server";
import CarouselService from ".";

export interface CreateCarouselPageProps {
  title: string;
  description?: string | undefined;
  buttonText: string | undefined;
  img: Promise<{
    createReadStream: () => any;
    filename: string;
    mimetype: string;
    encoding: string;
  }>;
  brandId?: number | string;
  productId?: number | string;
  disabled?: boolean;
}

export interface UpdateCarouselPageProps {
  id: string;
  title?: string;
  description?: string;
  buttonText?: string;
  img?: Promise<{
    createReadStream: () => any;
    filename: string;
    mimetype: string;
    encoding: string;
  }>;
  brandId?: number | string;
  productId?: number | string;
  disabled?: boolean;
}

const carouselResolvers = {
  Query: {
    getCarouselPages: async (
      _: unknown,
      {
        page = 1,
        limit = 10,
        search = "",
      }: { page: number; limit: number; search: string }
    ) => {
      try {
        const { carouselPages, totalCount, totalPages, currentPage } =
          await CarouselService.getCarouselPages(page, limit, search);

        return {
          carouselPages,
          totalCount,
          totalPages,
          currentPage,
        };
      } catch (error) {
        console.error("Error fetching carousel pages:", error);
        throw new Error("Failed to fetch carousel pages.");
      }
    },
  },
  Mutation: {
    createCarouselPage: async (
      _: any,
      {
        title,
        description,
        img,
        buttonText,
        brandId,
        productId,
        disabled,
      }: CreateCarouselPageProps
    ) => {
      try {
        const numericBrandId = brandId ? Number(brandId) : undefined;
        const numericProductId = productId ? Number(productId) : undefined;

        return await CarouselService.createCarouselPage(
          title,
          description,
          img,
          buttonText,
          numericBrandId,
          numericProductId,
          disabled
        );
      } catch (error) {
        console.error("Error creating carousel page:", error);
        throw new Error("Failed to create carousel page.");
      }
    },

    updateCarouselPage: async (
      _: any,
      {
        id,
        title,
        description,
        img,
        buttonText,
        brandId,
        productId,
        disabled,
      }: UpdateCarouselPageProps
    ) => {
      try {
        const numericBrandId = brandId ? Number(brandId) : undefined;
        const numericProductId = productId ? Number(productId) : undefined;

        return await CarouselService.updateCarouselPage(
          id,
          title,
          description,
          buttonText,
          img,
          numericBrandId,
          numericProductId,
          disabled
        );
      } catch (error) {
        console.error("Error updating carousel page:", error);

        if (error instanceof Error) {
          throw new Error(
            error.message ||
              "An unexpected error occurred while updating the carousel page."
          );
        } else {
          throw new Error(
            "An unexpected error occurred while updating the carousel page."
          );
        }
      }
    },

    deleteCarouselPage: async (_: any, args: any) => {
      const { id } = args;
      try {
        const result = await CarouselService.deleteCarouselPage(id);
        return result;
      } catch (error) {
        console.error("Error deleting carousel page:", error);
        throw new ApolloError("Failed to delete carousel page.");
      }
    },
  },
};

export default carouselResolvers;
