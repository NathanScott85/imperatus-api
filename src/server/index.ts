import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express, { Request } from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import PrismaService from "../services/prisma";
import resolvers from "../services/users/resolvers";
import typeDefs from "../services/users/typeDefs";
import AuthorizationTokenService, { TokenPayload } from "../services/token";

export const prisma = PrismaService.getInstance();

interface MyContext {
  user: any;
  prisma: typeof prisma;
  req: Request;
  refreshToken: string | string[] | undefined;
}

export const startServer = async (): Promise<http.Server> => {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<MyContext> => {
        const authHeader = req.headers.authorization || "";
        const accessToken = authHeader.replace("Bearer ", "");
        const refreshToken =
          req.headers["x-refresh-token"] || req.headers.refreshtoken;

        let user = null;

        if (accessToken) {
          try {
            const decodedToken = AuthorizationTokenService.verifyToken(
              accessToken,
              "access"
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

            type UserRole = { role: { name: string } };

            const roles = dbUser.userRoles.map(
              (userRole: UserRole) => userRole.role.name
            );

            user = {
              id: dbUser.id,
              email: dbUser.email,
              roles,
            };
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.warn(
                `Unable to authenticate using token: ${accessToken}`,
                error.message
              );
            } else {
              console.warn("An unknown error occurred.");
            }
          }
        }

        return { user, prisma, req, refreshToken };
      },
    })
  );

  return httpServer;
};
