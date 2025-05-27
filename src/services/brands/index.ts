import { Prisma } from "@prisma/client";
import UploadService from "../upload";
import { ApolloError } from "apollo-server";
import { prisma } from "../../server";

class BrandsService {
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
  public async getBrandsByCategory(categoryId: number) {
    const products = await prisma.product.findMany({
        where: { categoryId },
        include: { brand: true },
    });

    const brandMap = new Map<number, any>();

    for (const product of products) {
        if (product.brand) {
            brandMap.set(product.brand.id, product.brand);
        }
    }

    return Array.from(brandMap.values());
}

  public async createProductBrand( name: string, description: string, img: any ): Promise<any> {
    try {
      if ( !name ) throw new Error( "Brand name is required." );

      const existingBrand = await prisma.productBrands.findUnique( { where: { name } } );
      if ( existingBrand ) {
        throw new Error( "Product brand already exists. Please choose a different name." );
      }

      let fileRecord = null;
      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } = await UploadService.processUpload( stream, filename, mimetype );

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

      return { ...brand, img: fileRecord ? { ...fileRecord } : null };
    } catch ( error ) {
      console.error( "Error in createProductBrand method:", error );
      throw new Error( "An unexpected error occurred while creating the product brand. Please try again." );
    }
  }

  public async updateProductBrand( id: number, name: string, description: string, img: any ): Promise<any> {
    try {
      let fileRecord = null;
      if ( img ) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        fileRecord = await prisma.file.findUnique( { where: { fileName: filename } } );

        if ( !fileRecord ) {
          const { s3Url, key, fileName, contentType } = await UploadService.processUpload( stream, filename, mimetype );
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

      return { ...updatedBrand, img: fileRecord };
    } catch ( error ) {
      console.error( "Error in updateProductBrand method:", error );
      throw new Error( "An unexpected error occurred while updating the product brand." );
    }
  }

  public async deleteBrand( id: string ) {
    try {
      const brand = await prisma.productBrands.findUnique( { where: { id: parseInt( id ) }, include: { img: true } } );

      if ( !brand ) {
        throw new ApolloError( `Brand with ID ${id} does not exist`, "BRAND_NOT_FOUND" );
      }

      if ( brand.imgId && brand.img ) {
        await UploadService.deleteFileFromS3( brand.img.key );
        await prisma.file.delete( { where: { id: brand.imgId } } );
      }

      await prisma.productBrands.delete( { where: { id: parseInt( id ) } } );

      return { message: "Brand deleted successfully" };
    } catch ( error ) {
      console.error( "Error in deleteBrand method:", error );
      throw new ApolloError( "Failed to delete brand", "DELETE_FAILED" );
    }
  }
}

export default new BrandsService();
