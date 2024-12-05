import { ApolloError, AuthenticationError } from 'apollo-server';
import { prisma } from '../../server';
import ProductsService from '../products';
import { isAdminOrOwner } from '../roles/role-checks';

const productResolvers = {
  Query: {
    getAllProducts: async (
      _: unknown,
      { page = 1, limit = 10 }: { page: number; limit: number },
    ) => {
      try {
        const { products, totalCount, totalPages, currentPage } = await ProductsService.getAllProducts(page, limit);
        return {
          products,
          totalCount,
          totalPages,
          currentPage,
        };
      } catch (error) {
        console.error("Error in getAllProducts resolver:", error);
        throw new Error("Failed to retrieve products");
      }
    },
    getAllProductTypes: async () => {
      return await ProductsService.getAllProductTypes();
    },

    getAllBrands: async (_: unknown, { page = 1, limit = 10 }: { page: number; limit: number }) => {
      const { brands, totalCount, totalPages, currentPage } = await ProductsService.getAllBrands(page, limit);
      return {
        brands,
        totalCount,
        totalPages,
        currentPage
      }
    },

    getProductById: async (_: any, args: { id: string }) => {
      try {
        return await ProductsService.getProductById(parseInt(args.id));
      } catch (error) {
        console.error("Error in product resolver:", error);
        throw new ApolloError("Failed to retrieve product");
      }
    },
  },
  Product: {
    category: async (parent: any) => {
      return await prisma.category.findUnique({
        where: { id: parent.categoryId },
      });
    },
    stock: async (parent: any) => {
      return await prisma.stock.findUnique({
        where: { productId: parent.id },
      });
    },
    img: async (parent: any) => {
      return await prisma.file.findUnique({
        where: { id: parent.imgId },
      });
    },
    type: async (parent: any) => {
      return await prisma.productType.findUnique({
        where: { id: parent.productTypeId }
      })
    },
    products: async (parent: any) => {
      return await prisma.category.findUnique({
        where: { id: parent.categoryId },
      });
    },
    brands: async (parent: any) => {
      return await prisma.productBrands.findUnique({
        where: { id: parent.brandId }
      })
    }
  },
  Mutation: {
    createProductType: async (_: any, { input }: { input: { name: string } }) => {
      try {
        const existingType = await prisma.productType.findUnique({
          where: { name: input.name },
        });

        if (existingType) {
          throw new Error("Product type already exists.");
        }

        return await prisma.productType.create({
          data: { name: input.name },
        });

      } catch (error) {
        console.error("Error creating product type:", error);
        throw new Error("An unexpected error occurred while creating the product type.");
      }
    },

    createProductBrand: async (_: any, { name, description, img }: any) => {
      try {
        return ProductsService.createProductBrand(name, description, img);
      } catch (error) {
        console.error("Error in createProduct resolver:", error);
        throw new Error("Failed to create product.");
      }
    },

    createProduct: async (_: any, args: any) => {
      const {
        name,
        price,
        productTypeId,
        description,
        img,
        categoryId,
        brandId,
        setId,
        stock,
        preorder,
        rrp,
      } = args;
      try {
        const newProduct = await ProductsService.createProduct(
          name,
          price,
          productTypeId,
          description,
          img,
          categoryId,
          brandId,
          setId,
          stock,
          preorder,
          rrp
        );

        return newProduct;
      } catch (error) {
        console.error("Error in createProduct resolver:", error);
        throw new Error("Failed to create product.");
      }
    },
    updateProduct: async (
      _: any,
      {
        id,
        productTypeId,
        categoryId,
        name,
        price,
        description,
        img,
        stockAmount,
        stockSold,
        stockInstock,
        stockSoldout,
        stockPreorder,
        preorder,
        rrp,
      }: {
        id: string;
        categoryId: number;
        name?: string;
        price?: number;
        productTypeId: number,
        description?: string;
        img?: any;
        stockAmount?: number;
        stockSold?: number;
        stockInstock?: string;
        stockSoldout?: string;
        stockPreorder?: string;
        preorder?: boolean;
        rrp?: number;
      },
      { user }: any
    ): Promise<any> => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      if (!isAdminOrOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }

      try {
        const updatedProduct = await ProductsService.updateProduct(
          id,
          productTypeId,
          categoryId,
          name,
          price,
          description,
          img,
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

        if (!updatedProduct) {
          throw new ApolloError("Product update failed. No product returned.");
        }
        return updatedProduct
      } catch (error) {
        console.error("Error in updateProduct resolver:", error);
        throw new ApolloError("Failed to update product", "UPDATE_FAILED");
      }

    },
    async updateProductBrand(_: any, { id, name, description, img }: any) {
      try {
        return await ProductsService.updateProductBrand(parseInt(id, 10), name, description, img);
      } catch (error) {
        console.error("Error in updateProductBrand resolver:", error);
        throw new Error("Failed to update product brand.");
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
    deleteBrand: async (
      _: any,
      args: { id: string },
      { user }: any
    ): Promise<{ message: string }> => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      if (!isAdminOrOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }

      try {
        return await ProductsService.deleteBrand(args.id);
      } catch (error) {
        console.error("Error in deleteBrand resolver:", error);
        throw new ApolloError("Failed to delete brand", "DELETE_FAILED");
      }
    },

  },

};

export default productResolvers;
