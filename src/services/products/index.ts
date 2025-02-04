import { Prisma } from "@prisma/client";
import UploadService from "../upload";
import { ApolloError } from "apollo-server";
import { prisma } from "../../server";
import { formatSlug } from '../../lib/'


class ProductsService {
  public async getAllProducts( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const whereClause: Prisma.ProductWhereInput = search
        ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
        : {};

      const [products, totalCount] = await Promise.all( [
        prisma.product.findMany( {
          skip: offset,
          take: limit,
          where: whereClause,
          include: {
            category: {
              include: {
                img: true,
              },
            },
            stock: true,
            img: true,
            type: true,
            set: true,
            brand: {
              include: {
                img: true,
              },
            },
          },
        } ),
        prisma.product.count( { where: whereClause } ),
      ] );

      return {
        products,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error in getProducts:", error );
      throw new Error( "Failed to retrieve products" );
    }
  }

  public async getAllProductTypes( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [types, totalCount] = await Promise.all( [
        prisma.productType.findMany( {
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
          skip: offset,
          take: limit,
        } ),
        prisma.productType.count( {
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
        } ),
      ] );

      return {
        types,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving product types:", error );
      throw new Error( "Failed to retrieve product types" );
    }
  }

  public async getAllBrands( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;
      const [brands, totalCount] = await Promise.all( [
        prisma.productBrands.findMany( {
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
          skip: offset,
          take: limit,
          include: {
            img: true,
          },
        } ),
        prisma.productBrands.count( {
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
        } ),
      ] );

      return {
        brands,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving product brands", error );
      throw new Error( "Unable to fetch brands" );
    }
  }

  public async getAllProductSets( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;
      const [sets, totalCount] = await Promise.all( [
        prisma.productSet.findMany( {
          where: search
            ? {
              setName: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
          skip: offset,
          take: limit,
        } ),
        prisma.productSet.count( {
          where: search
            ? {
              setName: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
        } ),
      ] );
      return {
        sets,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page
      }
    } catch ( error ) {
      console.error( "Error retrieving product sets", error );
      throw new Error( `Unable to fetch sets, ${error}` );
    }
  }
  public async getProductById( id: number ) {
    try {
      const product = await prisma.product.findUnique( {
        where: { id },
        include: {
          stock: true,
          img: true,
          category: true,
          type: true,
          brand: true
        },
      } );

      if ( !product ) {
        throw new Error( "Product not found" );
      }

      return product;
    } catch ( error ) {
      console.error( "Error in getProductById:", error );
      throw new Error( "Failed to retrieve product" );
    }
  }

  async createProductType( name: string ) {
    const existingType = await prisma.productType.findUnique( {
      where: { name },
    } );

    if ( existingType ) {
      throw new Error( "Product type already exists." );
    }

    return await prisma.productType.create( {
      data: { name },
    } );
  }

  async createProductBrand( name: string, description: string, img: any ): Promise<any> {
    try {

      if ( !name ) throw new Error( "Brand name is required." );

      const existingBrand = await prisma.productBrands.findUnique( {
        where: { name },
      } );
      if ( existingBrand ) {
        throw new Error( "Product brand already exists. Please choose a different name." );
      }

      let fileRecord = null;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload( stream, filename, mimetype );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );
      }

      const brand = await prisma.productBrands.create( {
        data: {
          name,
          description,
          imgId: fileRecord?.id ?? null,
        },
      } );
      return {
        ...brand,
        img: fileRecord ? { ...fileRecord } : null,
      };
    } catch ( error ) {
      console.error( "Error in createProductBrand method:", error );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "A product with this name already exists. Please choose a different name."
        );
      }

      // Re-throw other unexpected errors
      throw new Error(
        "An unexpected error occurred while creating the product brand. Please try again."
      );
    }
  }

  async createProductSet( setName: string, setCode: string, description: string ): Promise<any> {
    try {
      if ( !setName ) throw new Error( "Set name is required" );

      const existingSet = await prisma.productSet.findUnique( {
        where: { setName }
      } );
      if ( existingSet ) {
        throw new Error( "Product set already exists. Please choose a different name" )
      }

      return await prisma.productSet.create( {
        data: {
          setName,
          setCode,
          description
        }
      } );

    } catch ( error ) {
      console.error( "Error in createProductBrand method:", error );
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "A product with this name already exists. Please choose a different name."
        );
      }

      // Re-throw other unexpected errors
      throw new Error(
        "An unexpected error occurred while creating the product set. Please try again."
      );
    }
  }

  public async createProduct(
    name: string,
    price: number,
    productTypeId: number,
    description: string,
    img: any,
    categoryId: number,
    brandId: number,
    setId: number,
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
      const [existingProductType, existingProduct] = await Promise.all( [
        prisma.productType.findUnique( {
          where: { id: productTypeId },
        } ),
        prisma.product.findFirst( {
          where: { name: name.toLowerCase() },
        } ),
      ] );

      if ( !existingProductType || existingProduct ) {
        throw new Error(
          !existingProductType
            ? "Invalid product type. Please select a valid product type."
            : "A product with this name already exists. Please choose a different name."
        );
      }

      if ( !categoryId ) {
        throw new Error( "Category ID is required to create a product." );
      }

      const existingCategory = await prisma.category.findUnique( {
        where: { id: categoryId },
      } );

      if ( !existingCategory ) {
        throw new Error( "Invalid category. Please select a valid category." );
      }

      const existingSet = await prisma.productSet.findUnique( {
        where: { id: setId },
      } );

      if ( !existingSet ) {
        throw new Error( "Invalid set. Please select a valid set." );
      }

      const existingBrand = await prisma.productBrands.findUnique( {
        where: { id: brandId },
      } );

      if ( !existingBrand ) {
        throw new Error( "Invalid brand. Please select a valid brand." );
      }

      const product = await prisma.product.create( {
        data: {
          name,
          price,
          productTypeId: existingProductType!.id,
          description,
          preorder,
          rrp,
          categoryId,
          brandId,
          setId,
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
          type: true,
        },
      } );


      const slug = `${formatSlug( existingCategory.name )}/${product.id}/${formatSlug( name )}`;

      const updatedProduct = await prisma.product.update( {
        where: { id: product.id },
        data: {
          slug,
        },
        include: {
          stock: true,
          category: true,
          type: true,
        },
      } );

      let fileRecord = null;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } =
          await UploadService.processUpload( stream, filename, mimetype );

        fileRecord = await prisma.file.create( {
          data: {
            url: s3Url,
            key,
            fileName,
            contentType,
          },
        } );

        await prisma.product.update( {
          where: { id: updatedProduct.id },
          data: {
            imgId: fileRecord.id,
          },
        } );
      }

      return {
        ...updatedProduct,
        img: fileRecord,
      };
    } catch ( error ) {
      console.error( "Error in createProduct method:", error );
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error( "A product with this name already exists. Please choose a different name." );
      }

      throw new Error( "An unexpected error occurred while creating the product. Please try again." );
    }
  }

  public async updateProductBrand(
    id: number,
    name: string,
    description: string,
    img: any
  ): Promise<any> {
    try {

      let fileRecord = null;
      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        fileRecord = await prisma.file.findUnique( {
          where: { fileName: filename },
        } );

        if ( !fileRecord ) {
          const { s3Url, key, fileName, contentType } =
            await UploadService.processUpload( stream, filename, mimetype );

          fileRecord = await prisma.file.create( {
            data: {
              url: s3Url,
              key,
              fileName,
              contentType,
            },
          } );
        }
      }

      const updatedBrand = await prisma.productBrands.update( {
        where: { id },
        data: {
          name,
          description: description ?? undefined,
          imgId: fileRecord?.id ?? undefined,
        },
      } );


      return {
        ...updatedBrand,
        img: fileRecord,
      };
    } catch ( error ) {
      console.error( 'Error in updateProductBrand method:', error );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error( 'Product brand not found.' );
      }
      throw new Error( 'An unexpected error occurred while updating the product brand.' );
    }
  }

  public async updateProductSet(
    id: number,
    setName: string,
    setCode: string,
    description: string
  ): Promise<any> {
    try {
      const updatedSet = await prisma.productSet.update( {
        where: { id },
        data: {
          setName,
          setCode,
          description: description ?? undefined,
        },
      } );

      return updatedSet;
    } catch ( error ) {
      console.error( 'Error in updateProductSet method:', error );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error( 'Product set not found.' );
      }
      throw new Error( 'An unexpected error occurred while updating the product set.' );
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
    try {
      let fileRecord = null;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        fileRecord = await prisma.file.findUnique( {
          where: { fileName: filename },
        } );

        if ( !fileRecord ) {
          const { s3Url, key, fileName, contentType } =
            await UploadService.processUpload( stream, filename, mimetype );

          fileRecord = await prisma.file.create( {
            data: {
              url: s3Url,
              key,
              fileName,
              contentType,
            },
          } );
        }
      }

      if ( productTypeId ) {
        const productTypeExists = await prisma.productType.findUnique( {
          where: { id: productTypeId },
        } );

        if ( !productTypeExists ) {
          throw new Error( `ProductType with ID ${productTypeId} does not exist.` );
        }
      }

      if ( categoryId ) {
        const categoryExists = await prisma.category.findUnique( {
          where: { id: categoryId },
        } );

        if ( !categoryExists ) {
          throw new Error( `Category with ID ${categoryId} does not exist.` );
        }
      }

      const existingProduct = await prisma.product.findUnique( {
        where: { id: parseInt( id ) },
        include: { category: true },
      } );

      if ( !existingProduct ) {
        throw new Error( `Product with ID ${id} does not exist.` );
      }

      const isNameChanged = name && name !== existingProduct.name;
      const isCategoryChanged = categoryId && categoryId !== existingProduct.categoryId;

      let updatedSlug = existingProduct.slug;

      if ( isNameChanged || isCategoryChanged ) {
        const updatedCategory = categoryId
          ? await prisma.category.findUnique( { where: { id: categoryId } } )
          : existingProduct.category;

        if ( !updatedCategory ) {
          throw new Error( `Invalid category for slug update.` );
        }

        updatedSlug = `${formatSlug( updatedCategory.name )}/${id}/${formatSlug(
          name || existingProduct.name
        )}`;
      }

      const product = await prisma.product.update( {
        where: { id: parseInt( id ) },
        data: {
          name: name ?? undefined,
          price: price ?? undefined,
          productTypeId: productTypeId,
          description: description ?? undefined,
          preorder: preorder ?? undefined,
          rrp: rrp ?? undefined,
          imgId: fileRecord?.id ?? undefined,
          categoryId: categoryId ?? undefined,
          slug: isNameChanged || isCategoryChanged ? updatedSlug : undefined,
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
          type: true,
        },
      } );

      return {
        ...product,
        img: fileRecord,
      };
    } catch ( error ) {
      console.error( 'Error in updateProduct method:', error );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new Error(
          'A product with this name already exists. Please choose a different name.'
        );
      }

      throw new Error(
        'An unexpected error occurred while updating the product. Please try again.'
      );
    }
  }


  public async deleteProduct( id: string ) {
    try {
      const product = await prisma.product.findUnique( {
        where: { id: parseInt( id ) },
        include: { img: true, stock: true },
      } );

      if ( !product ) {
        throw new ApolloError(
          `Product with ID ${id} does not exist`,
          "PRODUCT_NOT_FOUND"
        );
      }

      if ( product.stock ) {
        await prisma.stock.delete( {
          where: { productId: product.id },
        } );
      }

      if ( product.img ) {
        await UploadService.deleteFileFromS3( product.img.key );
        await prisma.file.delete( {
          where: { id: product.img.id },
        } );
      }

      await prisma.product.delete( {
        where: { id: parseInt( id ) },
      } );

      return { message: "Product deleted successfully" };
    } catch ( error ) {
      console.error( "Error in deleteProduct method:", error );
      throw new ApolloError( "Failed to delete product", "DELETE_FAILED" );
    }
  }

  public async deleteBrand( id: string ) {
    try {
      const brand = await prisma.productBrands.findUnique( {
        where: { id: parseInt( id ) },
        include: { img: true },
      } );

      if ( !brand ) {
        throw new ApolloError(
          `Brand with ID ${id} does not exist`,
          "BRAND_NOT_FOUND"
        );
      }


      if ( brand.imgId && brand.img ) {
        await UploadService.deleteFileFromS3( brand.img.key );
        await prisma.file.delete( {
          where: { id: brand.imgId },
        } );
      }

      await prisma.productBrands.delete( {
        where: { id: parseInt( id ) },
      } );

      return { message: "Brand deleted successfully" };
    } catch ( error ) {
      console.error( "Error in deleteBrand method:", error );
      throw new ApolloError( "Failed to delete brand", "DELETE_FAILED" );
    }
  }

  public async deleteSet( id: string ) {
    try {
      const set = await prisma.productSet.findUnique( {
        where: { id: parseInt( id ) },
      } );
      if ( !set ) {
        throw new ApolloError(
          `Set with ID ${id} does not exist`,
          "SET_NOT_FOUND"
        );
      }

      await prisma.productSet.delete( {
        where: { id: parseInt( id ) },
      } );

      return { message: "Set deleted successfully" };
    } catch ( error ) {
      console.error( "Error in deleteSet method:", error );
      throw new ApolloError( "Failed to delete set", "DELETE_FAILED" );
    }
  }


}

export default new ProductsService();
