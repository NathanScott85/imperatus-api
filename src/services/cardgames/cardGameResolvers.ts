import { prisma } from '../../server';
import CardGameService from '../cardgames';

const cardGameResolvers = {
  Query: {
    getAllCardGames: async () => {
      return await CardGameService.getAllCardGames();
  },
    getCardGameById: async (_: any, { id }: { id: string }) => {
      return await CardGameService.getCardGameById(parseInt(id));
    },
  },
  Mutation: {
    createCardGame: async (
      _: any,
      { name, description, img, categoryId }: { name: string; description: string; img: any; categoryId: number }
    ) => {
      return await CardGameService.createCardGame(name, description, img, categoryId);
    },
    updateCardGame: async (
      _: any,
      { id, name, description, img, categoryId }: { id: string; name: string; description: string; img: any; categoryId: number }
    ) => {
      return await CardGameService.updateCardGame(id, name, description, img, categoryId);
    },
    deleteCardGame: async (_: any, { id }: { id: string }) => {
      return await CardGameService.deleteCardGame(id);
    },
  },
  CardGame: {
    category: async (parent: any) => {
      return await prisma.category.findUnique({
        where: { id: parent.categoryId },
      });
    },
    img: async (parent: any) => {
      return await prisma.file.findUnique({
        where: { id: parent.imgId },
      });
    },
  },
};

export default cardGameResolvers;
