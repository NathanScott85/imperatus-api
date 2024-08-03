import { ApolloServer } from "apollo-server";
import PrismaService from "../services/prisma";
import resolvers from "../services/users/resolvers";
import typeDefs from "../services/users/typeDefs";
import TokenService, { TokenPayload } from "../services/token";

export const prisma = PrismaService.getInstance();

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
  context: async ({ req }) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    let user = null;

    if (token) {
      try {
        // Verify the JWT and extract user info
        const decodedToken = TokenService.verifyToken(token) as TokenPayload;

        // Fetch the user from the database based on decoded token
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
        console.warn(`Unable to authenticate using token: ${token}`, e);
      }
    }

    return { user, prisma, req };
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
