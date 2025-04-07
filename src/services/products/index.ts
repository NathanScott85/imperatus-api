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
      brandId?: number[];
      setId?: number[];
      rarityId?: number[];
      inStockOnly?: boolean;
      outOfStockOnly?: boolean;
      preorderOnly?: boolean;
      priceMin?: number;
      priceMax?: number;
    } = {}
  ) {
    try {
      const offset = (page - 1) * limit;

      const productWhere: Prisma.ProductWhereInput = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }),
        ...(filters.brandId?.length && {
          brandId: { in: filters.brandId },
        }),
        ...(filters.setId?.length && {
          setId: { in: filters.setId },
        }),
        ...(filters.rarityId?.length && {
          rarityId: { in: filters.rarityId },
        }),
        ...(filters.priceMin !== undefined && filters.priceMax !== undefined && {
          price: {
            gte: filters.priceMin,
            lte: filters.priceMax,
          },
        }),
        ...(filters.priceMin !== undefined && filters.priceMax === undefined && {
          price: { gte: filters.priceMin },
        }),
        ...(filters.priceMax !== undefined && filters.priceMin === undefined && {
          price: { lte: filters.priceMax },
        }),
      };

      const inStock = filters.inStockOnly === true;
      const outOfStock = filters.outOfStockOnly === true;
      const preorder = filters.preorderOnly === true;

      if (inStock && outOfStock) {
        productWhere.OR = [
          { stock: { is: { amount: { gt: 0 } } } },
          { stock: { is: { amount: 0 } } },
        ];
      } else if (inStock) {
        productWhere.stock = {
          is: { amount: { gt: 0 } },
        };
      } else if (outOfStock) {
        productWhere.stock = {
          is: { amount: 0 },
        };
      }

      if (preorder) {
        if (productWhere.stock?.is) {
          productWhere.stock.is.preorder = true;
        } else if (productWhere.stock) {
          productWhere.stock.is = { preorder: true };
        } else {
          productWhere.stock = {
            is: { preorder: true },
          };
        }
      }

      const searchOnlyWhere: Prisma.ProductWhereInput | undefined = search
        ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
        : undefined;

      const [products, totalCount, brands, sets, rarities, hasInStock, hasPreorder, hasOutOfStock] =
        await Promise.all([
          prisma.product.findMany({
            skip: offset,
            take: limit,
            where: productWhere,
            include: {
              category: { include: { img: true } },
              stock: true,
              img: true,
              type: true,
              rarity: true,
              variant: true,
              set: true,
              cardType: true,
              brand: { include: { img: true } },
            },
          }),
          prisma.product.count({ where: productWhere }),
          prisma.productBrands.findMany({
            ...(searchOnlyWhere && {
              where: {
                product: {
                  some: searchOnlyWhere,
                },
              },
            }),
            include: { img: true },
          }),
          prisma.productSet.findMany({
            ...(searchOnlyWhere && {
              where: {
                product: {
                  some: searchOnlyWhere,
                },
              },
            }),
          }),
          prisma.rarity.findMany({
            ...(searchOnlyWhere && {
              where: {
                products: {
                  some: searchOnlyWhere,
                },
              },
            }),
          }),
          prisma.product.count({
            where: {
              ...productWhere,
              stock: { is: { amount: { gt: 0 } } },
            },
          }),
          prisma.product.count({
            where: {
              ...productWhere,
              stock: { is: { preorder: true } },
            },
          }),
          prisma.product.count({
            where: {
              ...productWhere,
              stock: { is: { amount: 0 } },
            },
          }),
        ]);

      const stockStatus = {
        hasInStock: hasInStock > 0,
        hasPreorder: hasPreorder > 0,
        hasOutOfStock: hasOutOfStock > 0,
      };

      return {
        filters,
        products,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        brands,
        sets,
        rarities,
        stockStatus,
      };
    } catch (error) {
      console.error("Error in getAllProducts:", error);
      throw new Error("Failed to retrieve products");
    }
  }

  public async getAllPreorders(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    filters: {
      brandId?: number[];
      setId?: number[];
      rarityId?: number[];
      priceMin?: number;
      priceMax?: number;
    } = {}
  ) {
    try {
      const offset = (page - 1) * limit;

      const productWhere: Prisma.ProductWhereInput = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }),
        ...(filters.brandId?.length && {
          brandId: { in: filters.brandId },
        }),
        ...(filters.setId?.length && {
          setId: { in: filters.setId },
        }),
        ...(filters.rarityId?.length && {
          rarityId: { in: filters.rarityId },
        }),
        ...(filters.priceMin !== undefined && filters.priceMax !== undefined && {
          price: {
            gte: filters.priceMin,
            lte: filters.priceMax,
          },
        }),
        ...(filters.priceMin !== undefined && filters.priceMax === undefined && {
          price: { gte: filters.priceMin },
        }),
        ...(filters.priceMax !== undefined && filters.priceMin === undefined && {
          price: { lte: filters.priceMax },
        }),
        stock: {
          is: { preorder: true },
        },
      };

      const [products, totalCount, brands, sets, rarities] = await Promise.all([
        prisma.product.findMany({
          skip: offset,
          take: limit,
          where: productWhere,
          include: {
            category: { include: { img: true } },
            stock: true,
            img: true,
            type: true,
            rarity: true,
            variant: true,
            set: true,
            cardType: true,
            brand: { include: { img: true } },
          },
        }),
        prisma.product.count({ where: productWhere }),
        prisma.productBrands.findMany({ include: { img: true } }),
        prisma.productSet.findMany(),
        prisma.rarity.findMany(),
      ]);

      return {
        filters,
        products,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        brands,
        sets,
        rarities,
        stockStatus: {
          hasPreorder: totalCount > 0,
          hasInStock: false,
          hasOutOfStock: false,
        },
      };
    } catch (error) {
      console.error("Error in getAllPreorders:", error);
      throw new Error("Failed to retrieve preorder products");
    }
  }

  public async getPreordersById(
    id: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      brandId?: number[];
      setId?: number[];
      rarityId?: number[];
      priceMin?: number;
      priceMax?: number;
      inStockOnly?: boolean;
      outOfStockOnly?: boolean;
      preorderOnly?: boolean;
    } = {}
) {
    try {
        const offset = (page - 1) * limit;
        const parsedId = parseInt(id);

        const productWhere: Prisma.ProductWhereInput = {
            brandId: parsedId,
            stock: {
                is: { preorder: true },
            },
            ...(filters.setId?.length && {
                setId: { in: filters.setId },
            }),
            ...(filters.rarityId?.length && {
                rarityId: { in: filters.rarityId },
            }),
            ...(filters.priceMin !== undefined && filters.priceMax !== undefined && {
                price: {
                    gte: filters.priceMin,
                    lte: filters.priceMax,
                },
            }),
            ...(filters.priceMin !== undefined && filters.priceMax === undefined && {
                price: { gte: filters.priceMin },
            }),
            ...(filters.priceMax !== undefined && filters.priceMin === undefined && {
                price: { lte: filters.priceMax },
            }),
        };

        const inStock = filters?.inStockOnly === true;
        const outOfStock = filters?.outOfStockOnly === true;
        const preorder = filters?.preorderOnly === true;

        if (inStock && outOfStock) {
            productWhere.OR = [
                { stock: { is: { amount: { gt: 0 } } } },
                { stock: { is: { amount: 0 } } },
            ];
        } else if (inStock) {
            productWhere.stock = {
                is: { amount: { gt: 0 } },
            };
        } else if (outOfStock) {
            productWhere.stock = {
                is: { amount: 0 },
            };
        }

        if (preorder) {
            if (productWhere.stock?.is) {
                productWhere.stock.is.preorder = true;
            } else if (productWhere.stock) {
                productWhere.stock.is = { preorder: true };
            } else {
                productWhere.stock = {
                    is: { preorder: true },
                };
            }
        } else {
            if (!productWhere.stock) {
                productWhere.stock = {
                    is: { preorder: true },
                };
            } else if (!productWhere.stock.is) {
                productWhere.stock.is = { preorder: true };
            } else {
                productWhere.stock.is.preorder = true;
            }
        }

        const [products, totalCount, rarities, brand, hasInStock, hasPreorder, hasOutOfStock] = await Promise.all([
            prisma.product.findMany({
                skip: offset,
                take: limit,
                where: productWhere,
                include: {
                    category: { include: { img: true } },
                    stock: true,
                    img: true,
                    type: true,
                    rarity: true,
                    variant: true,
                    set: true,
                    cardType: true,
                    brand: { include: { img: true } },
                },
            }),
            prisma.product.count({ where: productWhere }),
            prisma.rarity.findMany({
                where: {
                    products: {
                        some: productWhere,
                    },
                },
            }),
            prisma.productBrands.findUnique({
                where: { id: parsedId },
                include: { img: true },
            }),
            prisma.product.count({
                where: {
                    brandId: parsedId,
                    stock: { is: { amount: { gt: 0 } } },
                },
            }),
            prisma.product.count({
                where: {
                    brandId: parsedId,
                    stock: { is: { preorder: true } },
                },
            }),
            prisma.product.count({
                where: {
                    brandId: parsedId,
                    stock: { is: { amount: 0 } },
                },
            }),
        ]);

        const setIds = products.map((p) => p.setId).filter(Boolean) as number[];

        const sets = setIds.length
            ? await prisma.productSet.findMany({
                  where: {
                      id: { in: setIds },
                  },
              })
            : [];

        const stockStatus = {
            hasInStock: hasInStock > 0,
            hasPreorder: hasPreorder > 0,
            hasOutOfStock: hasOutOfStock > 0,
        };

        return {
            products,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            sets,
            rarities,
            brands: brand ? [brand] : [],
            stockStatus,
        };
    } catch (error) {
        console.error('Error in getPreordersById:', error);
        throw new Error('Failed to retrieve preorder products for brand');
    }
  }

  public async getAllProductVariants(page: number = 1, limit: number = 10, search: string = "") {
    try {
      const offset = (page - 1) * limit;

      const [variants, totalCount] = await Promise.all([
        prisma.productVariant.findMany({
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
        }),
        prisma.productVariant.count({
          where: search
            ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
            : undefined,
        }),
      ]);

      return {
        variants,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error retrieving product variants:", error);
      throw new Error("Failed to retrieve product variants");
    }
  }

  public async getLatestProducts(): Promise<any[]> {
    try {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
        include: {
          category: {
            include: {
              img: true,
            },
          },
          stock: true,
          img: true,
          type: true,
          rarity: true,
          variant: true,
          set: true,
          cardType: true,
          brand: {
            include: {
              img: true,
            },
          },
        },
      });

      return products;
    } catch (error) {
      console.error("Error in getLatestProducts:", error);
      throw new Error("Failed to retrieve latest products");
    }
  }

  public async getProductById(id: number) {
    try {
      console.log(id, 'id');
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stock: true,
          img: true,
          category: {
            include: {
              img: true
            }
          },
          type: true,
          brand: true,
        },
      });
      console.log(product?.category)
      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (error) {
      console.error("Error in getProductById:", error);
      throw new Error("Failed to retrieve product");
    }
  }

  public async createVariant(name: string) {
    try {
      return await prisma.productVariant.create({
        data: {
          name,
        },
      });
    } catch (error) {
      console.error("Error creating rarity:", error);
      throw new Error("Failed to create rarity");
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
    rarityId?: number
  ): Promise<any> {
    try {
      const [
        existingProductType,
        existingCardType,
        existingVariant,
        existingCategory,
        existingSet,
        existingBrand,
        existingRarity
      ] = await Promise.all([
        prisma.productType.findUnique({ where: { id: productTypeId } }),
        cardTypeId ? prisma.cardType.findUnique({ where: { id: cardTypeId } }) : null,
        variantId ? prisma.productVariant.findUnique({ where: { id: variantId } }) : null,
        prisma.category.findUnique({ where: { id: categoryId } }),
        setId ? prisma.productSet.findUnique({ where: { id: setId } }) : null,
        prisma.productBrands.findUnique({ where: { id: brandId } }),
        rarityId ? prisma.rarity.findUnique({ where: { id: rarityId } }) : null
      ]);

      if (!existingProductType) {
        throw new Error("Invalid product type. Please select a valid product type.");
      }

      if (variantId && !existingVariant) {
        throw new Error("Invalid product variant. Please select a valid product variant.");
      }

      if (cardTypeId && !existingCardType) {
        throw new Error("Invalid card type. Please select a valid card type.");
      }

      if (!existingCategory || !existingBrand || (setId && !existingSet)) {
        throw new Error("Invalid category, set, or brand. Please select valid options.");
      }

      if (rarityId && !existingRarity) {
        throw new Error("Invalid rarity. Please select a valid rarity.");
      }

      const product = await prisma.product.create({
        data: {
          name,
          price,
          productTypeId,
          cardTypeId,
          variantId,
          description,
          preorder,
          rrp,
          categoryId,
          brandId,
          setId,
          rarityId,
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
          rarity: true,
        },
      });

      const slug = `${formatSlug(name)}`;

      const updatedProduct = await prisma.product.update({
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
          rarity: true,
        },
      });

      let fileRecord = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

        const { s3Url, key, fileName, contentType } = await UploadService.processUpload(
          stream,
          filename,
          mimetype
        );

        const uniqueFileName = `${Date.now()}-${fileName}`;

        fileRecord = await prisma.file.create({
          data: { url: s3Url, key, fileName: uniqueFileName, contentType },
        });

        await prisma.product.update({
          where: { id: updatedProduct.id },
          data: { imgId: fileRecord.id },
        });
      }

      return { ...updatedProduct, img: fileRecord };
    } catch (error) {
      console.error("Error in createProduct method:", error);
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

      if (productTypeId) {
        const productTypeExists = await prisma.productType.findUnique({
          where: { id: productTypeId },
        });

        if (!productTypeExists) {
          throw new Error(`ProductType with ID ${productTypeId} does not exist.`);
        }
      }

      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!categoryExists) {
          throw new Error(`Category with ID ${categoryId} does not exist.`);
        }
      }

      const existingProduct = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { category: true },
      });

      if (!existingProduct) {
        throw new Error(`Product with ID ${id} does not exist.`);
      }

      const isNameChanged = name && name !== existingProduct.name;
      const isCategoryChanged = categoryId && categoryId !== existingProduct.categoryId;

      let updatedSlug = existingProduct.slug;

      if (isNameChanged || isCategoryChanged) {
        const updatedCategory = categoryId
          ? await prisma.category.findUnique({ where: { id: categoryId } })
          : existingProduct.category;

        if (!updatedCategory) {
          throw new Error(`Invalid category for slug update.`);
        }

        updatedSlug = `${formatSlug(
          name || existingProduct.name
        )}`;
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
      });

      return {
        ...product,
        img: fileRecord,
      };
    } catch (error) {
      console.error('Error in updateProduct method:', error);

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
