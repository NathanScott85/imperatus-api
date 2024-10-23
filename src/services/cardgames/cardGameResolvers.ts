import { prisma } from '../../server';
import CardGameService from '../cardgames';

const cardGameResolvers = {
  Query: {
    getAllCardGames: async () => {
      return await CardGameService.getAllCardGames();
    },
    getCardGameById: async (_: any, args: { id: string }) => {
      return await CardGameService.getCardGameById(parseInt(args.id));
    },
  },
  Mutation: {
    createCardGame: async (
      _: any,
      { name, price, description, img, categoryId, stock, preorder, rrp }: any
    ) => {
      return await CardGameService.createCardGame(
        name,
        price,
        description,
        img,
        categoryId,
        stock,
        preorder,
        rrp
      );
    },
    updateCardGame: async (_: any, { id, name, price, description, img, categoryId, stock, preorder, rrp }: any) => {
      return await CardGameService.updateCardGame(
        id, name, price, description, img, categoryId, stock, preorder, rrp
      );
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
    stock: async (parent: any) => {
      return await prisma.stock.findUnique({
        where: { productId: parent.id },
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
