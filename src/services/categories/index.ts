import { Prisma } from "@prisma/client";
import { ApolloError } from "apollo-server";
import UploadService from "../upload";
import { prisma } from "../../server";
import { formatSlug } from "../../lib";


class CategoriesService {
  public async getAllCategories(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    filters: {
      priceMin?: number;
      priceMax?: number;
      preorder?: boolean;
      productTypeId?: number;
      setId?: number | number[];
      brandId?: number | number[];
      variantId?: number | number[];
      stockMin?: number;
      stockMax?: number;
      // rarityIds?: number[];
    } = {}
  ) {
    const offset = ( page - 1 ) * limit;
    const whereClause: Prisma.CategoryWhereInput = {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        filters.priceMin !== undefined || filters.priceMax !== undefined
          ? {
            products: {
              some: {
                AND: [
                  filters.priceMin !== undefined ? { price: { gte: filters.priceMin } } : {},
                  filters.priceMax !== undefined ? { price: { lte: filters.priceMax } } : {},
                ],
              },
            },
          }
          : {},
        filters.stockMin !== undefined || filters.stockMax !== undefined
          ? {
            products: {
              some: {
                stock: {
                  AND: [
                    filters.stockMin !== undefined ? { amount: { gte: filters.stockMin } } : {},
                    filters.stockMax !== undefined ? { amount: { lte: filters.stockMax } } : {},
                  ],
                },
              },
            },
          }
          : {},
        filters.brandId !== undefined
          ? {
            products: {
              some: {
                brandId: { in: Array.isArray( filters.brandId ) ? filters.brandId : [filters.brandId] },
              },
            },
          }
          : {},
        filters.preorder !== undefined
          ? {
            products: {
              some: {
                preorder: filters.preorder,
              },
            },
          }
          : {},
        filters.setId !== undefined
          ? {
            products: {
              some: {
                setId: { in: Array.isArray( filters.setId ) ? filters.setId : [filters.setId] },
              },
            },
          }
          : {},
        filters.variantId !== undefined
          ? {
            products: {
              some: {
                variantId: { in: Array.isArray( filters.variantId ) ? filters.variantId : [filters.variantId] },
              },
            },
          }
          : {},
        filters.productTypeId !== undefined
          ? {
            products: {
              some: {
                productTypeId: { in: Array.isArray( filters.productTypeId ) ? filters.productTypeId : [filters.productTypeId] },
              },
            },
          }
          : {},
      ],
    };

    const [categories, totalCount] = await Promise.all( [
      prisma.category.findMany( {
        where: whereClause,
        skip: offset,
        take: limit,
        include: {
          img: true,
          type: true,
          products: {
            where: {
              AND: [
                filters.brandId !== undefined
                  ? { brandId: { in: Array.isArray( filters.brandId ) ? filters.brandId : [filters.brandId] } }
                  : {},
                filters.priceMin !== undefined ? { price: { gte: filters.priceMin } } : {},
                filters.priceMax !== undefined ? { price: { lte: filters.priceMax } } : {},
                filters.preorder !== undefined ? { preorder: filters.preorder } : {},
                filters.setId !== undefined
                  ? { setId: { in: Array.isArray( filters.setId ) ? filters.setId : [filters.setId] } }
                  : {},
                filters.variantId !== undefined
                  ? { variantId: { in: Array.isArray( filters.variantId ) ? filters.variantId : [filters.variantId] } }
                  : {},
                filters.productTypeId !== undefined
                  ? { productTypeId: { in: Array.isArray( filters.productTypeId ) ? filters.productTypeId : [filters.productTypeId] } }
                  : {},
                filters.stockMin !== undefined ? { stock: { amount: { gte: filters.stockMin } } } : {},
                filters.stockMax !== undefined ? { stock: { amount: { lte: filters.stockMax } } } : {},
              ],
            },
            include: {
              stock: true,
              type: true,
              img: true,
              brand: true,
              set: true,
              variant: true,
              rarities: true,
              category: true
            },
          },
        },
      } ),
      prisma.category.count( {
        where: whereClause,
      } ),
    ] );

    return {
      filters,
      categories,
      totalCount,
      totalPages: Math.ceil( totalCount / limit ),
      currentPage: page,
    };
  }

  public async getAllCategoryTypes() {
    try {
      const productTypes = await prisma.categoryType.findMany( {
        include: {
          categories: true,
        }
      } );
      return productTypes;
    } catch ( error ) {
      console.error( "Error retrieving product types:", error );
      throw new Error( "Failed to retrieve product types" );
    }
  }

  public async getCategoryById( id: string, page: number = 1, limit: number = 1000 ) {
    const offset = ( page - 1 ) * limit;

    const [category, totalCount] = await Promise.all( [
      prisma.category.findUnique( {
        where: { id: parseInt( id ) },
        include: {
          type: true,
          products: {
            skip: offset,
            take: limit,
            include: {
              stock: true,
              img: true,
              brand: true,
              set: true,
              variant: true,
              cardType: true,
              rarities: { include: { rarity: true } },
            },
          },
          img: true,
        },
      } ),
      prisma.product.count( { where: { categoryId: parseInt( id ) } } ),
    ] );

    if ( !category ) {
      throw new Error( `Category with ID ${id} not found` );
    }

    return {
      ...category,
      totalCount,
      totalPages: Math.ceil( totalCount / limit ),
      currentPage: page,
    };
  }

  public async getCategoryByName( name: string ) {
    return await prisma.category.findUnique( {
      where: { name },
      include: {
        type: true,
        products: {
          include: {
            stock: true,
          },
        },
        img: true,
      },
    } );
  }

  public async createCategory(
    name: string,
    description: string,
    img: any
  ): Promise<any> {
    try {

      if ( !name ) throw new Error( "Category name is required." );
  
      const normalizedName = name.toLowerCase();
      const normalizedType = name.toLowerCase();
  
      const existingCategory = await prisma.category.findFirst({
        where: { name: { equals: normalizedName, mode: "insensitive" } },
      });
  
      if ( existingCategory ) {
        throw new Error( "A category with this name already exists. Please choose a different name." );
      }
  
      let categoryType = await prisma.categoryType.upsert({
        where: { name: normalizedType },
        update: {},
        create: { name: normalizedType },
      });
  
      const slug = formatSlug(name);
  
      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          categoryTypeId: categoryType.id,
        },
      });
  
      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();
  
        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload(stream, filename, mimetype);
  
        const fileRecord = await prisma.file.create({
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        });
  
        await prisma.category.update({
          where: { id: category.id },
          data: { imgId: fileRecord.id },
        });
      }
  
      const fullCategory = await prisma.category.findUnique({
        where: { id: category.id },
        include: { img: true, type: true, },
      });
  
      return fullCategory;
    } catch (error) {
      console.error("Error while creating category:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("A category with this name already exists. Please choose a different name.");
      }
    }
  }

  public async deleteCategory( id: string ) {
    try {
      const category = await prisma.category.findUnique( {
        where: { id: parseInt( id ) },
        include: { products: true, img: true },
      } );

      if ( !category ) {
        throw new ApolloError(
          `Category with ID ${id} does not exist`,
          "CATEGORY_NOT_FOUND"
        );
      }

      if ( category.products.length > 0 ) {
        await prisma.product.deleteMany( {
          where: { categoryId: parseInt( id ) },
        } );
      }

      if ( category.img ) {
        await UploadService.deleteFileFromS3( category.img.key );
        await prisma.file.delete( {
          where: { id: category.img.id },
        } );
      }

      await prisma.category.delete( {
        where: { id: parseInt( id ) },
      } );

      return { message: "Category deleted successfully" };
    } catch ( error ) {
      console.error( "Error in deleteCategory method:", error );
      throw new ApolloError( "Failed to delete category", "DELETE_FAILED" );
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

      const updatedName = name ? name : existingCategory.name;
      const updatedSlug = name ? formatSlug(name) : existingCategory.slug;

      await prisma.category.update({
        where: { id: parseInt(id) },
        data: {
          name: updatedName,
          slug: updatedSlug,
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
