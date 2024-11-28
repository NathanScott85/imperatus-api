import { Prisma, PrismaClient, ProductType } from "@prisma/client";
import UploadService from "../upload";
import { ApolloError } from "apollo-server";

const prisma = new PrismaClient();

class ProductsService {
  public async getAllProducts(page: number = 1, limit: number = 10) {
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
            type: true,
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

  public async getAllProductTypes() {
    try {
      const productTypes = await prisma.productType.findMany();
      return productTypes;
    } catch (error) {
      console.error("Error retrieving product types:", error);
      throw new Error("Failed to retrieve product types");
    }
  }

  public async getProductById(id: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stock: true,
          img: true,
          category: true,
          type: true
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

  async createProductType(name: string) {
    const existingType = await prisma.productType.findUnique({
      where: { name },
    });

    if (existingType) {
      throw new Error("Product type already exists.");
    }

    return await prisma.productType.create({
      data: { name },
    });
  }

  public async createProduct(
    name: string,
    price: number,
    productTypeId: number,
    description: string,
    img: any,
    categoryId: number,
    stock: {
      amount: number;
      sold: number;
      instock: string;
      soldout: string;
      preorder: boolean;
    },
    preorder: boolean,
    rrp: number
  ): Promise<any> {
    try {
      const [existingProductType, existingProduct] = await Promise.all([
        prisma.productType.findUnique({
          where: { id: productTypeId },
        }),
        prisma.product.findFirst({
          where: { name: name.toLowerCase() },
        }),
      ]);

      if (!existingProductType || existingProduct) {
        throw new Error(
          !existingProductType
            ? "Invalid product type. Please select a valid product type."
            : "A product with this name already exists. Please choose a different name."
        );
      }

      if (categoryId) {
        const existingCategory = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!existingCategory) {
          throw new Error("Invalid category. Please select a valid category.");
        }
      } else {
        throw new Error("Category ID is required to create a product.");
      }

      const product = await prisma.product.create({
        data: {
          name,
          price,
          productTypeId,
          description,
          preorder,
          rrp,
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
          stock: true,
          category: true,
          type: true, // Include ProductType in the response
        },
      });

      let fileRecord = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload(stream, filename, mimetype);

        // Create the file record
        fileRecord = await prisma.file.create({
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        });

        await prisma.product.update({
          where: { id: product.id },
          data: {
            imgId: fileRecord.id, // Associate the file with the product
          },
        });
      }

      return {
        ...product,
        img: fileRecord, // Attach the file record to the response
      };
    } catch (error) {
      console.error("Error in createProduct method:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("A product with this name already exists. Please choose a different name.");
      }

      throw new Error("An unexpected error occurred while creating the product. Please try again.");
    }
  }


  public async updateProduct(
    id: string,
    productTypeId: number,
    categoryId: number,
    name?: string,
    price?: number,
    description?: string,
    img?: any,
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
    console.log(id, 'id');
    try {
      let fileRecord = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        fileRecord = await prisma.file.findUnique({
          where: { fileName: filename },
        });

        if (!fileRecord) {
          const { s3Url, key, fileName, contentType } =
            await UploadService.processUpload(stream, filename, mimetype);

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
      // Validate ProductTypeId
      if (productTypeId) {
        const productTypeExists = await prisma.productType.findUnique({
          where: { id: productTypeId },
        });

        if (!productTypeExists) {
          throw new Error(
            `ProductType with ID ${productTypeId} does not exist.`
          );
        }
      }

      // Validate CategoryId
      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!categoryExists) {
          throw new Error(
            `Category with ID ${categoryId} does not exist.`
          );
        }
      }

      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name: name ?? undefined,
          price: price ?? undefined,
          productTypeId: productTypeId,
          description: description ?? undefined,
          preorder: preorder ?? undefined,
          rrp: rrp ?? undefined,
          imgId: fileRecord?.id ?? undefined,
          categoryId,
          stock: stock
            ? {
              update: {
                amount: stock.amount ?? undefined,
                sold: stock.sold ?? undefined,
                instock: stock.instock ?? undefined,
                soldout: stock.soldout ?? undefined,
                preorder: stock.preorder ? true : false,
              },
            }
            : undefined,
        },
        include: {
          category: true,
          img: true,
          stock: true,
          type: true, // Include product type for returning
        },
      });
      console.log("Product updated successfully:", product);

      if (!product) {
        throw new ApolloError("Product update failed. Product not found or invalid data.", "UPDATE_FAILED");
      }
      return {
        ...product,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in updateProduct method:", error);

      // Handle duplicate name error
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
