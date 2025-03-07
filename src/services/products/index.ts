import { Prisma } from "@prisma/client";
import UploadService from "../upload";
import { ApolloError } from "apollo-server";
import { prisma } from "../../server";
import { formatSlug } from '../../lib/'

class ProductsService {
  public async getAllProducts(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    filters: {
      brandId?: number;
      setId?: number;
      variantId?: number;
      rarityIds?: number[];
      cardTypeId?: number;
      productTypeId?: number;
      priceMin?: number;
      priceMax?: number;
      preorder?: boolean;
      stockMin?: number;
      stockMax?: number;
    } = {}
  ) {
    try {
      const offset = ( page - 1 ) * limit;

      const whereClause: Prisma.ProductWhereInput = {
        ...( search && {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        } ),
        ...( filters.brandId && { brandId: filters.brandId } ),
        ...( filters.setId && { setId: filters.setId } ),
        ...( filters.variantId && { variantId: filters.variantId } ),
        ...( filters.productTypeId && { productTypeId: filters.productTypeId } ),
        ...( filters.cardTypeId && { cardTypeId: filters.cardTypeId } ),
        ...( filters.preorder !== undefined && { preorder: filters.preorder } ),
        ...( filters.priceMin !== undefined || filters.priceMax !== undefined
          ? {
            price: {
              ...( filters.priceMin !== undefined ? { gte: filters.priceMin } : {} ),
              ...( filters.priceMax !== undefined ? { lte: filters.priceMax } : {} ),
            },
          }
          : {} ),
        ...( filters.stockMin !== undefined || filters.stockMax !== undefined
          ? {
            stock: {
              is: {
                amount: {
                  ...( filters.stockMin !== undefined ? { gte: filters.stockMin } : {} ),
                  ...( filters.stockMax !== undefined ? { lte: filters.stockMax } : {} ),
                },
              },
            },
          }
          : {} ),

        ...( filters.rarityIds && filters.rarityIds.length > 0 && {
          rarities: {
            some: {
              rarityId: { in: filters.rarityIds },
            },
          },
        } ),
      };

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
            rarities: true,
            variant: true,
            set: true,
            cardType: true,
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
        filters,
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

  public async getAllProductVariants( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [variants, totalCount] = await Promise.all( [
        prisma.productVariant.findMany( {
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
        prisma.productVariant.count( {
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
        variants, // Renamed from `variant` to `variants` for consistency
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving product variants:", error );
      throw new Error( "Failed to retrieve product variants" );
    }
  }

  public async getAllCardTypes( page: number = 1, limit: number = 10, search: string = "" ) {
    try {
      const offset = ( page - 1 ) * limit;

      const [cardTypes, totalCount] = await Promise.all( [
        prisma.cardType.findMany( {
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
            brand: true
          }
        } ),
        prisma.productVariant.count( {
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
        cardTypes,
        totalCount,
        totalPages: Math.ceil( totalCount / limit ),
        currentPage: page,
      };
    } catch ( error ) {
      console.error( "Error retrieving product variants:", error );
      throw new Error( "Failed to retrieve product variants" );
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
          brand: true,
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

  public async createVariant( name: string ) {
    try {
      return await prisma.productVariant.create( {
        data: {
          name,
        },
      } );
    } catch ( error ) {
      console.error( "Error creating rarity:", error );
      throw new Error( "Failed to create rarity" );
    }
  }

  public async createCardType( name: string, brandId: number ) {
    try {
      const existingBrand = await prisma.productBrands.findUnique( {
        where: { id: brandId },
      } );

      if ( !existingBrand ) {
        throw new Error( "Invalid brand. Please select a valid brand." );
      }

      return await prisma.cardType.create( {
        data: {
          name,
          brandId
        },
        include: {
          brand: true
        }
      } );
    } catch ( error ) {
      console.error( "Error creating card type:", error );
      throw new Error( "Failed to create card type." );
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
    stock: {
      amount: number;
      sold: number;
      instock: string;
      soldout: string;
      preorder: boolean;
    },
    preorder: boolean,
    rrp: number,
    variantId?: number,
    cardTypeId?: number,
    setId?: number,
  ): Promise<any> {
    try {
      const [
        existingProductType,
        existingCardType,
        existingVariant,
        existingCategory,
        existingSet,
        existingBrand
      ] = await Promise.all( [
        prisma.productType.findUnique( { where: { id: productTypeId } } ),
        cardTypeId ? prisma.cardType.findUnique( { where: { id: cardTypeId } } ) : null,
        variantId ? prisma.productVariant.findUnique( { where: { id: variantId } } ) : null,
        prisma.category.findUnique( { where: { id: categoryId } } ),
        setId ? prisma.productSet.findUnique( { where: { id: setId } } ) : null,
        prisma.productBrands.findUnique( { where: { id: brandId } } ),
      ] );

      if ( !existingProductType ) {
        throw new Error( "Invalid product type. Please select a valid product type." );
      }

      if ( variantId && !existingVariant ) {
        throw new Error( "Invalid product variant. Please select a valid product variant." );
      }

      if ( cardTypeId && !existingCardType ) {
        throw new Error( "Invalid card type. Please select a valid card type." );
      }

      if ( !existingCategory || !existingBrand || ( setId && !existingSet ) ) {
        throw new Error( "Invalid category, set, or brand. Please select valid options." );
      }

      const product = await prisma.product.create( {
        data: {
          name,
          price,
          productTypeId: existingProductType.id,
          cardTypeId: existingCardType ? existingCardType.id : null,
          variantId: existingVariant ? existingVariant.id : null,
          description,
          preorder,
          rrp,
          categoryId,
          brandId,
          setId: existingSet ? existingSet.id : null,
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
          cardType: true,
          brand: true,
          set: true,
          variant: true,
        },
      } );

      const slug = `${formatSlug( existingCategory.name )}/${product.id}/${formatSlug( name )}`;

      const updatedProduct = await prisma.product.update( {
        where: { id: product.id },
        data: { slug },
        include: {
          stock: true,
          category: true,
          type: true,
          cardType: true,
          brand: true,
          set: true,
          variant: true,
        },
      } );

      let fileRecord = null;

      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } = await UploadService.processUpload( stream, filename, mimetype );
        const uniqueFileName = `${Date.now()}-${fileName}`;

        fileRecord = await prisma.file.create( {
          data: { url: s3Url, key, fileName: uniqueFileName, contentType },
        } );

        await prisma.product.update( {
          where: { id: updatedProduct.id },
          data: { imgId: fileRecord.id },
        } );
      }

      return { ...updatedProduct, img: fileRecord };
    } catch ( error ) {
      console.error( "Error in createProduct method:", error );
      throw new Error( "An unexpected error occurred while creating the product. Please try again." );
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

  public async updateVariant( id: number, name: string ): Promise<any> {
    try {
      const updatedVariant = await prisma.productVariant.update( {
        where: { id },
        data: { name },
      } );

      return updatedVariant;
    } catch ( error ) {
      console.error( 'Error in updateVariant method:', error );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error( 'Variant not found.' );
      }
      throw new Error( 'An unexpected error occurred while updating the variant.' );
    }
  }

  public async updateCardType( id: number, name: string, brandId: number ) {

    try {
      const existingCardType = await prisma.cardType.findUnique( {
        where: { id: Number( id ) },
      } );

      if ( !existingCardType ) {
        throw new Error( "Card type not found." );
      }

      const existingBrand = await prisma.productBrands.findUnique( {
        where: { id: Number( brandId ) },
      } );

      if ( !existingBrand ) {
        throw new Error( "Invalid brand. Please select a valid brand." );
      }

      return await prisma.cardType.update( {
        where: { id },
        data: {
          name,
          brandId,
        },
      } );
    } catch ( error ) {
      console.error( "Error updating card type:", error );
      throw new Error( "Failed to update card type." );
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

  public async deleteCardType( id: string ): Promise<{ success: boolean; message: string }> {
    try {
      const existingCardType = await prisma.cardType.findUnique( {
        where: { id: parseInt( id ) },
      } );

      if ( !existingCardType ) {
        throw new Error( "Card type not found." );
      }

      await prisma.cardType.delete( {
        where: { id: parseInt( id ) },
      } );

      return {
        success: true,
        message: "Card type deleted successfully.",
      };
    } catch ( error ) {
      console.error( "Error in deleteCardType method:", error );
      throw new Error( "An unexpected error occurred while deleting the card type." );
    }
  }
}

export default new ProductsService();
