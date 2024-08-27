import { Prisma, PrismaClient } from "@prisma/client";
import UploadService from "../upload"; // Assume you have a service to handle S3 uploads

const prisma = new PrismaClient();

class ProductsService {
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
}

export default new ProductsService();
