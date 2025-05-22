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
import Stripe from "stripe";
import PrismaService from "../services/prisma";
import resolvers from "../services/users/resolvers";
import combinedTypeDefs from "../services/users/typeDefs";
import AuthorizationTokenService, { TokenPayload } from "../services/token";
import { logger } from "../logger";
import { graphqlUploadExpress } from "graphql-upload-ts";

export const prisma = PrismaService.getInstance();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

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

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;

          if (orderId) {
            try {
              await prisma.order.update({
                where: { id: Number(orderId) },
                data: { status: "paid" }, // or your status enum value
              });
              logger.info(`Order ${orderId} marked as paid.`);
            } catch (error) {
              logger.error(`Failed to update order ${orderId}:`, error);
            }
          } else {
            logger.warn("No orderId metadata on payment intent");
          }
          break;

        // Handle other events as needed

        default:
          logger.info(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    }
  );

  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });

  return httpServer;
};
