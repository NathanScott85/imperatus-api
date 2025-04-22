import {
  ApolloServer,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from "@apollo/server";
import helmet from "helmet";
import client from "prom-client";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express, { Request } from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import PrismaService from "../services/prisma";
import resolvers from "../services/users/resolvers";
import combinedTypeDefs from "../services/users/typeDefs";
import AuthorizationTokenService, { TokenPayload } from "../services/token";
import { logger } from "../logger";
import { graphqlUploadExpress } from "graphql-upload-ts";

export const prisma = PrismaService.getInstance();

interface MyContext {
  user: any;
  prisma: typeof prisma;
  req: Request;
  refreshToken: string | string[] | undefined;
}

export const startServer = async (): Promise<http.Server> => {
  const app = express();
  app.use(helmet());
  const httpServer = http.createServer(app);

  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics();

  const graphqlRequestsTotal = new client.Counter({
    name: "graphql_requests_total",
    help: "Total number of GraphQL requests",
  });

  const graphqlErrorsTotal = new client.Counter({
    name: "graphql_errors_total",
    help: "Total number of GraphQL errors",
  });

  const server = new ApolloServer<MyContext>({
    typeDefs: combinedTypeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async requestDidStart(
          requestContext: GraphQLRequestContext<MyContext>
        ): Promise<GraphQLRequestListener<MyContext>> {
          logger.info("Request started", {
            query: requestContext.request.query,
            variables: requestContext.request.variables,
          });
          graphqlRequestsTotal.inc();

          return {
            async didEncounterErrors(requestContext) {
              logger.error("GraphQL Errors", {
                errors: requestContext.errors,
                query: requestContext.request.query,
                variables: requestContext.request.variables,
              });
              graphqlErrorsTotal.inc();
            },
            async willSendResponse(requestContext) {
              const responseBody = requestContext.response.body;

              if (responseBody.kind === "single") {
                logger.info("Response sent", {
                  data: responseBody.singleResult.data,
                });
              }
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim());

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
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
              logger.warn(
                `Unable to authenticate using token: ${accessToken}`,
                error.message
              );
            } else {
              logger.warn("An unknown error occurred.");
            }
          }
        }

        return { user, prisma, req, refreshToken };
      },
    })
  );

  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });

  return httpServer;
};
