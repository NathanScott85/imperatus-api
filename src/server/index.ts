import { ApolloServer } from "apollo-server";
import PrismaService from "../services/prisma";
import resolvers from "../services/users/resolvers";
import typeDefs from "../services/users/typeDefs";
import AuthorizationTokenService from "../services/token";
import jwt from "jsonwebtoken";

export interface DecodedToken {
  id: number;
  email: string;
  roles: string[];
}

export const prisma = PrismaService.getInstance();

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || "";
    let user = null;

    if (token) {
      try {
        const decodedToken = AuthorizationTokenService.verifyToken(
          token.replace("Bearer ", "")
        );
        user = await prisma.user.findUnique({
          where: { id: (decodedToken as jwt.JwtPayload).id },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });
        if (!user) {
          throw new Error("User not found");
        }
      } catch (e) {
        console.warn(`Unable to authenticate using token: ${token}`);
      }
    }

    return { user, prisma, req };
  },
  plugins: [
    {
      requestDidStart: async () => ({
        willSendResponse: async ({ context }: any) => {
          // No authentication logic here, just for response handling if needed
        },
      }),
    },
  ],
});
