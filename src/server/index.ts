import { ApolloServer } from 'apollo-server';
import AuthService from '../services/auth';
import PrismaService from '../services/prisma';
import resolvers from '../services/users/resolvers';
import typeDefs from '../services/users/typeDefs';

export const prisma = PrismaService.getInstance();

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }: any) => {
    const token = req.headers.authorization || '';
    let user = null;
    if (token) {
      try {
        user = AuthService.verifyToken(token.replace('Bearer ', ''));
      } catch (e) {
        console.warn(`Unable to authenticate using token: ${token}`);
      }
    }
    return { user, prisma };
  },
});