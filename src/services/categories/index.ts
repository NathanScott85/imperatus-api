import { Prisma } from "@prisma/client";
import { ApolloError } from "apollo-server";
import UploadService from "../upload";
import { prisma } from "../../server";

class CategoriesService {
  public async getAllCategories() {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        img: true,
        products: true,
      },
    });
  }

  public async getCategoryById(id: string) {
    return await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          include: {
            stock: true,
          },
        },
        img: true,
      },
    });
  }

  public async getCategoryByName(name: string) {
    return await prisma.category.findUnique({
      where: { name },
      include: {
        products: {
          include: {
            stock: true,
          },
        },
        img: true,
      },
    });
  }
  public async createCategory(
    name: string,
    description: string,
    img: any
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
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: normalizedName,
        },
      });

      if (existingCategory) {
        throw new Error("Category already exists");
      }

      const category = await prisma.category.create({
        data: {
          name,
          description,
          imgId: fileRecord?.id ?? null,
        },
      });

      if (!category || !category.id) {
        throw new Error("Failed to create category");
      }

      return {
        ...category,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in createCategory method:", error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "A file with this name already exists. Please choose a different name."
        );
      }

      throw new Error(
        "An unexpected error occurred while creating the category. Please try again."
      );
    }
  }

  public async deleteCategory(id: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: { products: true, img: true },
      });

      if (!category) {
        throw new ApolloError(
          `Category with ID ${id} does not exist`,
          "CATEGORY_NOT_FOUND"
        );
      }

      if (category.products.length > 0) {
        await prisma.product.deleteMany({
          where: { categoryId: parseInt(id) },
        });
      }

      if (category.img) {
        await UploadService.deleteFileFromS3(category.img.key);
        await prisma.file.delete({
          where: { id: category.img.id },
        });
      }

      await prisma.category.delete({
        where: { id: parseInt(id) },
      });

      return { message: "Category deleted successfully" };
    } catch (error) {
      console.error("Error in deleteCategory method:", error);
      throw new ApolloError("Failed to delete category", "DELETE_FAILED");
    }
  }

  public async updateCategory(
    id: string,
    name?: string,
    description?: string,
    img?: any
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

      const existingCategory = await prisma.category.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingCategory) {
        throw new ApolloError("Category not found", "CATEGORY_NOT_FOUND");
      }

      await prisma.category.update({
        where: { id: parseInt(id) },
        data: {
          name: name ? name : existingCategory.name,
          description: description ? description : existingCategory.description,
          imgId: fileRecord?.id ?? existingCategory.imgId,
        },
      });

      const categoryWithImg = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: { img: true },
      });

      return categoryWithImg;
    } catch (error) {
      console.error("Error in updateCategory method:", error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "A category with this name already exists. Please choose a different name."
        );
      }

      throw new Error(
        "An unexpected error occurred while updating the category. Please try again."
      );
    }
  }
}

export default new CategoriesService();
