import { Prisma, PrismaClient } from "@prisma/client";
import UploadService from "../upload"; // Assume you have a service to handle S3 uploads
import { ApolloError } from "apollo-server";

const prisma = new PrismaClient();

class ProductsService {
  public async getProductById(id: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stock: true,
          img: true,
          category: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (error) {
      console.error("Error in getProductById:", error);
      throw new Error("Failed to retrieve product");
    }
  }
  public async getProducts(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          skip: offset,
          take: limit,
          include: {
            category: true,
            stock: true,
            img: true,
          },
        }),
        prisma.product.count(),
      ]);

      return {
        products,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error in getProducts:", error);
      throw new Error("Failed to retrieve products");
    }
  }
  public async createProduct(
    name: string,
    price: number,
    type: string,
    description: string,
    img: any,
    categoryId: number,
    stock: {
      amount: number;
      sold: number;
      instock: string;
      soldout: string;
      preorder: string;
    },
    preorder: boolean,
    rrp: number
  ): Promise<any> {
    try {
      let imgURL = null;
      let imgKey = null;
      let fileRecord = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload(stream, filename, mimetype);

        imgURL = s3Url;
        imgKey = key;

        fileRecord = await prisma.file.create({
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        });
      }

      const normalizedName = name.toLowerCase();

      const existingProduct = await prisma.category.findFirst({
        where: {
          name: normalizedName,
        },
      });

      if (existingProduct) {
        console.error(
          "Product with the same name already exists:",
          existingProduct
        );
        throw new Error("Product already exists");
      }

      const product = await prisma.product.create({
        data: {
          name,
          price,
          type,
          description,
          preorder,
          rrp,
          imgId: fileRecord?.id ?? null,
          categoryId,
          stock: {
            create: {
              amount: stock.amount,
              sold: stock.sold,
              instock: stock.instock,
              soldout: stock.soldout,
              preorder: stock.preorder,
            },
          },
        },
        include: {
          category: true,
          img: true,
          stock: true,
        },
      });

      if (!product || !product.id) {
        console.error("Failed to create product in database");
        throw new Error("Failed to create product");
      }

      // Format price and rrp
      return {
        ...product,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in createProduct method:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.error("Prisma error: Unique constraint violation");
        throw new Error(
          "A product with this name already exists. Please choose a different name."
        );
      }

      throw new Error(
        "An unexpected error occurred while creating the product. Please try again."
      );
    }
  }
  public async updateProduct(
    id: string,
    name?: string,
    price?: number,
    type?: string,
    description?: string,
    img?: any,
    categoryId?: number,
    stock?: {
      amount?: number;
      sold?: number;
      instock?: string;
      soldout?: string;
      preorder?: string;
    },
    preorder?: boolean,
    rrp?: number
  ): Promise<any> {
    try {
      let imgURL = null;
      let imgKey = null;
      let fileRecord = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        fileRecord = await prisma.file.findUnique({
          where: { fileName: filename },
        });

        if (!fileRecord) {
          // If file doesn't exist, process upload and create new file record
          const { s3Url, key, fileName, contentType } =
            await UploadService.processUpload(stream, filename, mimetype);

          imgURL = s3Url;
          imgKey = key;

          fileRecord = await prisma.file.create({
            data: {
              url: s3Url,
              key,
              fileName,
              contentType,
            },
          });
        }
      }
      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name: name ?? undefined,
          price: price ?? undefined,
          type: type ?? undefined,
          description: description ?? undefined,
          preorder: preorder ?? undefined,
          rrp: rrp ?? undefined,
          imgId: fileRecord?.id ?? undefined,
          categoryId: categoryId ?? undefined,
          stock: stock
            ? {
                update: {
                  amount: stock.amount ?? undefined,
                  sold: stock.sold ?? undefined,
                  instock: stock.instock ?? undefined,
                  soldout: stock.soldout ?? undefined,
                  preorder: stock.preorder ?? undefined,
                },
              }
            : undefined,
        },
        include: {
          category: true,
          img: true,
          stock: true,
        },
      });

      return {
        ...product,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in updateProduct method:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "A product with this name already exists. Please choose a different name."
        );
      }

      throw new Error(
        "An unexpected error occurred while updating the product. Please try again."
      );
    }
  }

  public async deleteProduct(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { img: true, stock: true },
      });

      if (!product) {
        throw new ApolloError(
          `Product with ID ${id} does not exist`,
          "PRODUCT_NOT_FOUND"
        );
      }

      if (product.stock) {
        await prisma.stock.delete({
          where: { productId: product.id },
        });
      }

      if (product.img) {
        await UploadService.deleteFileFromS3(product.img.key);
        await prisma.file.delete({
          where: { id: product.img.id },
        });
      }

      await prisma.product.delete({
        where: { id: parseInt(id) },
      });

      return { message: "Product deleted successfully" };
    } catch (error) {
      console.error("Error in deleteProduct method:", error);
      throw new ApolloError("Failed to delete product", "DELETE_FAILED");
    }
  }
}

export default new ProductsService();
