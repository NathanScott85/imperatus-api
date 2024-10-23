import { prisma } from "../../server";
import { AuthenticationError, ApolloError } from "apollo-server";
import CategoriesService from "../categories";
import { isAdminOrOwner } from "../roles/role-checks";

const categoryResolvers = {
  Query: {
    categories: async () => {
      return await CategoriesService.getAllCategories();
    },

    category: async (_: any, args: any) => {
      return await CategoriesService.getCategoryById(args.id);
    },

    getCategoryByName: async (_: any, args: { name: string }) => {
      try {
        const category = await CategoriesService.getCategoryByName(args.name);
        if (!category) {
          throw new Error(`Category with name "${args.name}" not found`);
        }
        return category;
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Failed to retrieve category by name:", errorMessage);
        throw new Error("Failed to retrieve category by name");
      }
    },
  },

  Mutation: {
    createCategory: async (_: any, { name, description, img }: any) => {
      return await CategoriesService.createCategory(name, description, img);
    },

    deleteCategory: async (
      _: unknown,
      args: { id: string },
      context: any
    ): Promise<{ message: string }> => {
      const { id } = args;
      const requestingUserId = context.user.id;

      try {
        const requestingUser = await prisma.user.findUnique({
          where: { id: requestingUserId },
          include: { userRoles: { include: { role: true } } },
        });

        if (!requestingUser) {
          throw new AuthenticationError("You must be logged in");
        }

        const roles = requestingUser.userRoles.map(
          (userRole) => userRole.role.name
        );

        if (!roles.includes("OWNER")) {
          throw new AuthenticationError(
            "You do not have permission to delete this category"
          );
        }

        return await CategoriesService.deleteCategory(id);
      } catch (error) {
        console.error("Error in deleteCategory resolver:", error);
        throw error;
      }
    },

    updateCategory: async (
      _: any,
      {
        id,
        name,
        description,
        img,
      }: { id: string; name?: string; description?: string; img?: any },
      context: any
    ) => {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!isAdminOrOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }

      return await CategoriesService.updateCategory(id, name, description, img);
    },
  },

  Category: {
    products: async (parent: any) => {
      return await prisma.product.findMany({
        where: { categoryId: parent.id },
      });
    },
  },
};

export default categoryResolvers;
