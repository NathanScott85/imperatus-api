import { prisma } from "../../server";
import { AuthenticationError, UserInputError } from "apollo-server";
import UserService from "../users";
import AuthenticationService from "../authentication";
import AuthorizationTokenService from "../token";
import { isOwner } from "../roles/role-checks";
import moment from "moment-timezone";
import { GraphQLUpload } from "graphql-upload-ts";
import categoriesResolvers from "../categories/categoriesResolvers";
import productResolvers from "../products/productsResolvers";
import userResolvers from "./userResolvers";
import carouselResolvers from "../carousel/carouselResolvers";
import promotionResolvers from "../promotions/promotionsResolvers";
import productSetResolvers from "../product-sets/productSetResolvers";
import brandsResolvers from "../brands/brandsResolvers";
import productTypesResolvers from "../product-type/productTypeResolvers";
import rarityResolvers from "../card-rarity/cardRarityResolvers";
import roleResolvers from "../roles/rolesResolvers";
import variantResolvers from "../variants/variantsResolvers";
import cardTypeResolvers from "../card-types/cardTypeResolvers";
import vatResolvers from "../vat/vatResolvers";
import ordersResolvers from "../orders/ordersResolvers";
import discountCodeResolvers from "../discount-codes/discountCodeResolvers";
import paymentResolvers from "../payments/paymentResolvers";
import settingsResolvers from "../settings/settingsResolver";

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    ...categoriesResolvers.Query,
    ...productResolvers.Query,
    ...userResolvers.Query,
    ...carouselResolvers.Query,
    ...promotionResolvers.Query,
    ...productSetResolvers.Query,
    ...brandsResolvers.Query,
    ...productTypesResolvers.Query,
    ...rarityResolvers.Query,
    ...roleResolvers.Query,
    ...variantResolvers.Query,
    ...cardTypeResolvers.Query,
    ...vatResolvers.Query,
    ...discountCodeResolvers.Query,
    ...ordersResolvers.Query,
    ...settingsResolvers.Query,
    getVerificationStatus: async (_: any, { userId }: any) => {
      const verification = await UserService.getVerificationStatus(userId);
      return verification;
    },
    storeCreditHistory: async (
      _: any,
      {
        userId,
        limit = 5,
        offset = 0,
      }: { userId: number; limit: number; offset: number }
    ) => {
      const totalCount = await prisma.storeCreditTransaction.count({
        where: { userId },
      });

      const transactions = await prisma.storeCreditTransaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      });

      const formattedTransactions = transactions.map((transaction) => {
        return {
          ...transaction,
          date: moment(transaction.date)
            .tz("Europe/London")
            .format("YYYY-MM-DD"),
          time: moment(transaction.date).tz("Europe/London").format("HH:mm:ss"),
        };
      });

      return {
        transactions: formattedTransactions,
        totalCount,
      };
    },
  },
  Mutation: {
    ...categoriesResolvers.Mutation,
    ...productResolvers.Mutation,
    ...userResolvers.Mutation,
    ...carouselResolvers.Mutation,
    ...promotionResolvers.Mutation,
    ...productSetResolvers.Mutation,
    ...brandsResolvers.Mutation,
    ...productTypesResolvers.Mutation,
    ...rarityResolvers.Mutation,
    ...roleResolvers.Mutation,
    ...variantResolvers.Mutation,
    ...cardTypeResolvers.Mutation,
    ...discountCodeResolvers.Mutation,
    ...ordersResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...settingsResolvers.Mutation,
    async changeUserPassword(
      _: any,
      args: {
        id: number;
        newPassword: string;
        oldPassword: string;
      },
      context: any
    ) {
      try {
        const { id, newPassword, oldPassword } = args;
        const { refreshToken } = context;

        // Verify the refresh token
        const userFromToken = await AuthorizationTokenService.verifyToken(
          refreshToken,
          "refresh"
        );

        if (!userFromToken || userFromToken.id !== id) {
          throw new AuthenticationError(
            "You must be logged in or have permission to change this password"
          );
        }

        const user = await UserService.getUserById(id);
        if (!user) {
          throw new Error("User not found");
        }

        const response = await AuthenticationService.changeUserPassword(
          id,
          newPassword,
          oldPassword
        );

        return { message: response.message };
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Failed to change password:", errorMessage);
        throw new Error(`Failed to change password: ${errorMessage}`);
      }
    },

    requestPasswordReset: async (_: any, { email }: { email: string }) => {
      const dbUser = await UserService.findUserByEmail(email);
      if (!dbUser) {
        throw new UserInputError("User with this email does not exist.");
      }

      try {
        const response = await AuthenticationService.requestPasswordReset(
          email
        );

        return {
          message: response.message,
        };
      } catch (error) {
        console.error("Error requesting password reset:", error);

        return {
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while requesting a password reset.",
        };
      }
    },

    resetPassword: async (
      _: any,
      {
        token,
        newPassword,
        email,
      }: { token: string; newPassword: string; email: string }
    ) => {
      try {
        const response = await AuthenticationService.resetPassword(
          token,
          newPassword,
          email
        );

        return {
          message: response.message,
        };
      } catch (error) {
        console.error("Error resetting password:", error);

        return {
          message:
            error instanceof Error
              ? error.message
              : "An error occurred while resetting the password.",
        };
      }
    },
    verifyEmail: async (
      _: unknown,
      args: { token: string }
    ): Promise<{ message: string }> => {
      try {
        const result = await UserService.verifyEmail(args.token);
        return result;
      } catch (error: any) {
        console.error("Verification failed:", error);
        throw new Error(
          error.message || "Failed to verify email. Please try again later."
        );
      }
    },

    async sendVerificationEmail(_: any, { userId }: any) {
      try {
        const user = await UserService.getUserById(userId);

        if (!user || !user.email) {
          console.error("Resolver: User not found or email missing");
          return { message: "User not found or email not provided" };
        }

        const sendEmail = await UserService.sendVerificationEmail(userId);

        if (!sendEmail) {
          return {
            success: false,
            message: "Failed to send verification email.",
          };
        }

        return { message: "Verification email sent successfully." };
      } catch (error) {
        console.error("Resolver: Error in sendVerificationEmail:", error);
        return {
          success: false,
          message: "An error occurred while sending the verification email.",
        };
      }
    },

    async resendVerificationEmail(_: any, { userId }: { userId: number }) {
      try {
        const result = await UserService.resendVerificationEmail(userId);
        return result;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return { message: error.message || "An error occurred" };
        } else {
          return { message: "An unknown error occurred" };
        }
      }
    },

    loginUser: async (
      _: unknown,
      args: { email: string; password: string }
    ) => {
      try {
        const { accessToken, refreshToken, user } =
          await AuthenticationService.loginUser(args.email, args.password);
        return {
          accessToken,
          refreshToken,
          user,
        };
      } catch (error) {
        console.error(error, "error");
        throw new AuthenticationError("Invalid email or password");
      }
    },

    logoutUser: async (parent: any, args: any, context: any) => {
      const { refreshToken } = context;

      if (!refreshToken) {
        throw new AuthenticationError("Refresh token is missing.");
      }

      const result = await AuthenticationService.logoutUser(refreshToken);

      return result;
    },

    refreshToken: async (_: unknown, { refreshToken }: any) => {
      return await AuthorizationTokenService.refreshToken(refreshToken);
    },

    updateUserStoreCredit: async (
      _: any,
      { id, amount }: { id: number; amount: number },
      { user }: { user: any }
    ) => {
      if (!user || !isOwner(user)) {
        throw new AuthenticationError(
          "You must be logged in to update store credit."
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new Error("User not found.");
      }

      const newBalance = amount;

      const transactionType =
        newBalance > existingUser.storeCredit ? "credit" : "subtraction";

      const currentDateTime = moment().tz("Europe/London").toDate();

      await prisma.storeCreditTransaction.create({
        data: {
          userId: id,
          type: transactionType,
          amount: Math.abs(amount - existingUser.storeCredit),
          balanceAfter: newBalance,
          date: currentDateTime,
          time: moment(currentDateTime).format("HH:mm:ss"),
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { storeCredit: newBalance },
      });

      return updatedUser;
    },
  },
};

export default resolvers;
