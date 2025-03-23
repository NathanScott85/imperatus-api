import { ApolloError } from "apollo-server";
import VariantsService from ".";

const variantResolvers = {
    Query: {
        getAllVariants: async (
            _: unknown,
            { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
        ) => {
            try {
                const { variants, totalCount, totalPages, currentPage } =
                    await VariantsService.getAllProductVariants(page, limit, search);

                return {
                    variants,
                    totalCount,
                    totalPages,
                    currentPage,
                };
            } catch (error) {
                console.error("Error retrieving product variants:", error);
                throw new Error("Failed to retrieve product variants");
            }
        },
    },

    Mutation: {
        createVariant: async (_: any, { name }: { name: string }) => {
            try {
                return await VariantsService.createVariant(name);
            } catch (error) {
                console.error("Error in create variant resolver:", error);
                throw new Error("Failed to create variant");
            }
        },

        updateVariant: async (_: any, { id, name }: any) => {
            try {
                return await VariantsService.updateVariant(parseInt(id, 10), name);
            } catch (error) {
                console.error("Error in updateVariant resolver:", error);
                throw new Error("Failed to update variant.");
            }
        },
    },
};

export default variantResolvers;
