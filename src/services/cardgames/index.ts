import { Prisma, PrismaClient } from "@prisma/client";
import UploadService from "../upload";
import { ApolloError } from "apollo-server";

const prisma = new PrismaClient();

class CardGamesService {
  public async getAllCardGames() {
    return await prisma.product.findMany({
      where: { type: 'card-game' },
      include: {
        category: true,
        stock: true,
        img: true,
      },
    });
  }

  public async getCardGameById(id: number) {
    try {
      const cardGame = await prisma.product.findUnique({
        where: { id },
        include: {
          stock: true,
          img: true,
          category: true,
        },
      });

      if (!cardGame || cardGame.type !== "card-game") {
        throw new Error("Card game not found");
      }

      return cardGame;
    } catch (error) {
      console.error("Error in getCardGameById:", error);
      throw new Error("Failed to retrieve card game");
    }
  }

  public async getCardGames(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const [cardGames, totalCount] = await Promise.all([
        prisma.product.findMany({
          skip: offset,
          take: limit,
          where: { type: "card-game" },
          include: {
            category: true,
            stock: true,
            img: true,
          },
        }),
        prisma.product.count({ where: { type: "card-game" } }),
      ]);

      return {
        cardGames,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error in getCardGames:", error);
      throw new Error("Failed to retrieve card games");
    }
  }

  public async createCardGame(
    name: string,
    price: number,
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

      const existingCardGame = await prisma.product.findFirst({
        where: {
          name: normalizedName,
          type: "card-game",
        },
      });

      if (existingCardGame) {
        console.error(
          "Card game with the same name already exists:",
          existingCardGame
        );
        throw new Error("Card game already exists");
      }

      const cardGame = await prisma.product.create({
        data: {
          name,
          price,
          type: "card-game",
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

      if (!cardGame || !cardGame.id) {
        console.error("Failed to create card game in database");
        throw new Error("Failed to create card game");
      }

      return {
        ...cardGame,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in createCardGame method:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.error("Prisma error: Unique constraint violation");
        throw new Error(
          "A card game with this name already exists. Please choose a different name."
        );
      }

      throw new Error(
        "An unexpected error occurred while creating the card game. Please try again."
      );
    }
  }

  public async updateCardGame(
    id: string,
    name?: string,
    price?: number,
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
  
      // Handle image upload if provided
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
              url: imgURL,
              key: imgKey,
              fileName,
              contentType,
            },
          });
        }
      }
  
      // Update the card game record
      const cardGame = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name: name ?? undefined,
          price: price ?? undefined,
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
        ...cardGame,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in updateCardGame method:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error(
          "A card game with this name already exists. Please choose a different name."
        );
      }
  
      throw new Error(
        "An unexpected error occurred while updating the card game. Please try again."
      );
    }
  }  


  public async deleteCardGame(id: string) {
    try {
      const cardGame = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { img: true, stock: true },
      });

      if (!cardGame) {
        throw new ApolloError(
          `Card game with ID ${id} does not exist`,
          "CARD_GAME_NOT_FOUND"
        );
      }

      if (cardGame.stock) {
        await prisma.stock.delete({
          where: { productId: cardGame.id },
        });
      }

      if (cardGame.img) {
        await UploadService.deleteFileFromS3(cardGame.img.key);
        await prisma.file.delete({
          where: { id: cardGame.img.id },
        });
      }

      await prisma.product.delete({
        where: { id: parseInt(id) },
      });

      return { message: "Card game deleted successfully" };
    } catch (error) {
      console.error("Error in deleteCardGame method:", error);
      throw new ApolloError("Failed to delete card game", "DELETE_FAILED");
    }
  }
}

export default new CardGamesService();
