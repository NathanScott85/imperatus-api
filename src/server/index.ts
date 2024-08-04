import { ApolloServer, AuthenticationError } from "apollo-server";
import PrismaService from "../services/prisma";
import resolvers from "../services/users/resolvers";
import typeDefs from "../services/users/typeDefs";
import TokenService, { TokenPayload } from "../services/token";
import AuthorizationTokenService from "../services/token";
import AuthenticationService from "../services/authentication";

export const prisma = PrismaService.getInstance();

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
  context: async ({ req }: any) => {
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.replace("Bearer ", "");
    const refreshToken =
      req.headers["x-refresh-token"] || req.headers.refreshtoken;

    let user = null;

    if (accessToken) {
      try {
        const decodedToken = AuthorizationTokenService.verifyToken(
          accessToken
        ) as TokenPayload;

        const dbUser = await prisma.user.findUnique({
          where: { id: decodedToken.id },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!dbUser) {
          throw new Error("User not found");
        }

        // Map roles from userRoles to a simple array of role names
        const roles = dbUser.userRoles.map((userRole) => userRole.role.name);

        // Construct user object for context
        user = {
          id: dbUser.id,
          email: dbUser.email,
          roles,
        };
      } catch (e) {
        console.warn(`Unable to authenticate using token: ${accessToken}`, e);
      }
    }

    return { user, prisma, req, refreshToken };
  },
  plugins: [
    {
      requestDidStart: async () => ({
        willSendResponse: async ({ context }: any) => {
          // Modify the response if needed
        },
      }),
    },
  ],
});
