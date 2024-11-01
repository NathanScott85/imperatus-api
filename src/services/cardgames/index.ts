import { Prisma, PrismaClient } from "@prisma/client";
import UploadService from "../upload";
import { ApolloError } from "apollo-server";

const prisma = new PrismaClient();

class CardGamesService {
  public async getAllCardGames() {
    return await prisma.product.findMany({
      // where: { type: "CARDGAME" },
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
          img: true,
          category: true,
        },
      });

      // if (!cardGame || cardGame.type !== "CARDGAME") {
      //   throw new Error("Card game not found");
      // }

      return cardGame;
    } catch (error) {
      console.error("Error in getCardGameById:", error);
      throw new Error("Failed to retrieve card game");
    }
  }

  public async getCardGames(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      // const [cardGames, totalCount] = await Promise.all([
      //   prisma.product.findMany({
      //     skip: offset,
      //     take: limit,
      //     // where: { type: "CARDGAME" },
      //     include: {
      //       category: true,
      //       img: true,
      //     },
      //   }),
      // prisma.product.count({ where: { type: "CARDGAME" } }),
      // ]);

      // return {
      //   cardGames,
      //   totalCount,
      //   totalPages: Math.ceil(totalCount / limit),
      //   currentPage: page,
      // };
    } catch (error) {
      console.error("Error in getCardGames:", error);
      throw new Error("Failed to retrieve card games");
    }
  }

  public async createCardGame(
    name: string,
    description: string,
    img: any,
    categoryId: number
  ): Promise<any> {
    try {
      let fileRecord = null;

      if (img) {
        const { createReadStream, filename, mimetype } = await img;
        const stream = createReadStream();

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

      const normalizedName = name.toLowerCase();

      const existingCardGame = await prisma.product.findFirst({
        where: {
          name: normalizedName,
          // type: "CARDGAME",
        },
      });

      if (existingCardGame) {
        throw new Error("Card game already exists");
      }

      // const cardGame = await prisma.product.create({
      //   data: {
      //     name,
      //     type: "CARDGAME",
      //     description,
      //     imgId: fileRecord?.id ?? null,
      //     categoryId,
      //   },
      //   include: {
      //     category: true,
      //     img: true,
      //   },
      // });

      return {
        // ...cardGame,
        img: fileRecord,
      };
    } catch (error) {
      console.error("Error in createCardGame method:", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
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
    description?: string,
    img?: any,
    categoryId?: number
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

      const cardGame = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name: name ?? undefined,
          description: description ?? undefined,
          imgId: fileRecord?.id ?? undefined,
          categoryId: categoryId ?? undefined,
        },
        include: {
          category: true,
          img: true,
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
        include: { img: true },
      });

      if (!cardGame) {
        throw new ApolloError(
          `Card game with ID ${id} does not exist`,
          "CARD_GAME_NOT_FOUND"
        );
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
