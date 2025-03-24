import { ApolloError, AuthenticationError } from 'apollo-server';
import CardTypesService from '.';
import { isAdminOrOwner } from '../roles/role-checks';

const cardTypeResolvers = {
    Query: {
        getAllCardTypes: async (
            _: unknown,
            { page = 1, limit = 10, search = "" }: { page: number; limit: number; search?: string }
        ) => {
            try {
                const { cardTypes, totalCount, totalPages, currentPage } =
                    await CardTypesService.getAllCardTypes(page, limit, search);

                return {
                    cardTypes,
                    totalCount,
                    totalPages,
                    currentPage,
                };
            } catch (error) {
                console.error("Error in getAllCardTypes resolver:", error);
                throw new ApolloError("Failed to retrieve card types");
            }
        },
    },

    Mutation: {
        createCardType: async (
            _: unknown,
            { name, brandId }: { name: string; brandId: number },
            { user }: any
        ) => {
            if (!user) throw new AuthenticationError("You must be logged in");
            if (!isAdminOrOwner(user)) throw new AuthenticationError("Permission denied");

            try {
                return await CardTypesService.createCardType(name, brandId);
            } catch (error) {
                console.error("Error in createCardType resolver:", error);
                throw new ApolloError("Failed to create card type");
            }
        },

        updateCardType: async (
            _: unknown,
            { id, name, brandId }: { id: number; name: string; brandId: number },
            { user }: any
        ) => {
            if (!user) throw new AuthenticationError("You must be logged in");
            if (!isAdminOrOwner(user)) throw new AuthenticationError("Permission denied");

            try {
                const result = await CardTypesService.updateCardType(id, name, brandId);
                if (!result) throw new ApolloError("Failed to update card type - no result returned");
                return result;
            } catch (error) {
                console.error("Error in updateCardType resolver:", error);
                throw new ApolloError("Failed to update card type", "UPDATE_FAILED");
            }
        },

        deleteCardType: async (
            _: unknown,
            { id }: { id: string },
            { user }: any
        ) => {
            if (!user) throw new AuthenticationError("You must be logged in");
            if (!isAdminOrOwner(user)) throw new AuthenticationError("Permission denied");

            try {
                const result = await CardTypesService.deleteCardType(id);
                if (!result) throw new ApolloError("Failed to delete card type - no result returned");
                return result;
            } catch (error) {
                console.error("Error in deleteCardType resolver:", error);
                throw new ApolloError("Failed to delete card type", "DELETE_FAILED");
            }
        },
    },
};

export default cardTypeResolvers;
