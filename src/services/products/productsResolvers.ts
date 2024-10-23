import { AuthenticationError, ApolloError } from "apollo-server";
import ProductsService from "../products";
import { isAdminOrOwner } from "../roles/role-checks";

const productResolvers = {
  Mutation: {
    createProduct: async (_: any, args: any) => {
      const {
        name,
        price,
        type,
        description,
        img,
        categoryId,
        stock,
        preorder,
        rrp,
      } = args;

      return await ProductsService.createProduct(
        name,
        price,
        type,
        description,
        img,
        categoryId,
        stock,
        preorder,
        rrp
      );
    },

    updateProduct: async (
      _: any,
      {
        id,
        name,
        price,
        type,
        description,
        img,
        categoryId,
        stockAmount,
        stockSold,
        stockInstock,
        stockSoldout,
        stockPreorder,
        preorder,
        rrp,
      }: {
        id: string;
        name?: string;
        price?: number;
        type?: string;
        description?: string;
        img?: any;
        categoryId?: number; // Ensure this is a number
        stockAmount?: number;
        stockSold?: number;
        stockInstock?: string;
        stockSoldout?: string;
        stockPreorder?: string;
        preorder?: boolean;
        rrp?: number;
      },
      { user }: any
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      if (!isAdminOrOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }

      try {
        return await ProductsService.updateProduct(
          id,
          name,
          price,
          type,
          description,
          img,
          categoryId, // Pass categoryId as a number
          {
            amount: stockAmount,
            sold: stockSold,
            instock: stockInstock,
            soldout: stockSoldout,
            preorder: stockPreorder,
          },
          preorder,
          rrp
        );
      } catch (error) {
        console.error("Error in updateProduct resolver:", error);
        throw new ApolloError("Failed to update product", "UPDATE_FAILED");
      }
    },

    deleteProduct: async (
      _: any,
      args: { id: string },
      { user }: any
    ): Promise<{ message: string }> => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      // Check if the user has the necessary permissions to delete the product
      if (!isAdminOrOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }

      try {
        return await ProductsService.deleteProduct(args.id);
      } catch (error) {
        console.error("Error in deleteProduct resolver:", error);
        throw new ApolloError("Failed to delete product", "DELETE_FAILED");
      }
    },
  },
};

export default productResolvers;
