import { Prisma, ProductType } from "@prisma/client";
import { prisma } from "../../server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server";
import UserService from "../users";
import AuthenticationService from "../authentication";
import RoleService from "../roles"; // Import RoleService
import AuthorizationTokenService from "../token";
import {
  isOwner,
} from "../roles/role-checks";
import moment from "moment-timezone";
import { GraphQLUpload } from "graphql-upload-ts";
import categoriesResolvers from "../categories/categoriesResolvers";
import productResolvers from "../products/productsResolvers";
import userResolvers from "./userResolvers";
import carouselResolvers from '../carousel/carouselResolvers'

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    ...categoriesResolvers.Query,
    ...productResolvers.Query,
    ...userResolvers.Query,
    ...carouselResolvers.Query,
    getVerificationStatus: async ( _: any, { userId }: any ) => {
      const verification = await UserService.getVerificationStatus( userId );
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
      const totalCount = await prisma.storeCreditTransaction.count( {
        where: { userId },
      } );

      const transactions = await prisma.storeCreditTransaction.findMany( {
        where: { userId },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      } );

      const formattedTransactions = transactions.map( ( transaction ) => {
        return {
          ...transaction,
          date: moment( transaction.date )
            .tz( "Europe/London" )
            .format( "YYYY-MM-DD" ),
          time: moment( transaction.date ).tz( "Europe/London" ).format( "HH:mm:ss" ),
        };
      } );

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

        if ( !userFromToken || userFromToken.id !== id ) {
          throw new AuthenticationError(
            "You must be logged in or have permission to change this password"
          );
        }

        const user = await UserService.getUserById( id );
        if ( !user ) {
          throw new Error( "User not found" );
        }

        const response = await AuthenticationService.changeUserPassword(
          id,
          newPassword,
          oldPassword
        );

        return { message: response.message };
      } catch ( error ) {
        const errorMessage = ( error as Error ).message;
        console.error( "Failed to change password:", errorMessage );
        throw new Error( `Failed to change password: ${errorMessage}` );
      }
    },
    requestPasswordReset: async ( _: any, { email }: { email: string } ) => {
      // Ensure the provided email exists in the database
      const dbUser = await UserService.findUserByEmail( email );
      if ( !dbUser ) {
        throw new UserInputError( "User with this email does not exist." );
      }

      try {
        // Proceed to request a password reset
        const response = await AuthenticationService.requestPasswordReset(
          email
        );

        return {
          message: response.message,
        };
      } catch ( error ) {
        console.error( "Error requesting password reset:", error );

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
      } catch ( error ) {
        console.error( "Error resetting password:", error );

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
        const user = await prisma.user.findFirst( {
          where: {
            verificationToken: args.token,
            verificationTokenExpiry: {
              gte: new Date(),
            },
          },
        } );

        if ( !user ) {
          throw new Error( "Invalid or expired verification token" );
        }

        await prisma.user.update( {
          where: { id: user.id },
          data: {
            verificationToken: null,
            verificationTokenExpiry: null,
            emailVerified: true,
          },
        } );

        return { message: "Email verified successfully." };
      } catch ( error ) {
        console.error( "Verification failed:", error );
        return { message: "Failed to verify email. Please try again later." };
      }
    },

    async sendVerificationEmail( _: any, { userId }: any ) {
      try {
        const user = await UserService.getUserById( userId );

        if ( !user || !user.email ) {
          console.error( "User not found or email not provided" );
          return { message: "User not found or email not provided" };
        }

        const sendEmail = await UserService.sendVerificationEmail( userId );

        if ( !sendEmail ) {
          return {
            success: false,
            message: "Failed to send verification email.",
          };
        }

        return { message: "Verification email sent successfully." };
      } catch ( error ) {
        console.error( "Error in sendVerificationEmail:", error );
        return {
          message: "An error occurred while sending the verification email.",
        };
      }
    },

    loginUser: async (
      _: unknown,
      args: { email: string; password: string }
    ) => {
      try {
        const { accessToken, user } = await AuthenticationService.loginUser(
          args.email,
          args.password
        );

        const { refreshToken } =
          AuthorizationTokenService.refreshToken( accessToken );

        return { accessToken, user, refreshToken };
      } catch ( error ) {
        console.error( error, "error" );
        throw new AuthenticationError( "Invalid email or password" );
      }
    },

    logoutUser: async ( parent: any, args: any, context: any ) => {
      const { refreshToken } = context;

      if ( !refreshToken ) {
        throw new AuthenticationError( "Refresh token is missing." );
      }

      const result = await AuthenticationService.logoutUser( refreshToken );

      return result;
    },
    refreshToken: async ( _: unknown, { refreshToken }: any ) => {
      return await AuthorizationTokenService.refreshToken( refreshToken );
    },

    createRole: async ( _: unknown, args: { name: string }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.createRole( args.name );
    },

    deleteRole: async ( _: unknown, args: { name: string }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      await RoleService.deleteRole( args.name );
      return { message: "Role deleted successfully" };
    },

    updateUserRoles: async (
      _: unknown,
      args: { userId: number; roles: string[] },
      { user }: any
    ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError(
          "You do not have permission to update roles"
        );
      return await UserService.updateUserRoles( args.userId, args.roles );
    },

    assignRoleToUser: async (
      _: unknown,
      { userId, roleName }: { userId: number; roleName: string },
      { user }: any
    ) => {
      if ( !user || !isOwner( user ) ) {
        throw new AuthenticationError( "Permission denied" );
      }
      return await RoleService.assignRoleToUser( userId, roleName );
    },

    updateUserStoreCredit: async (
      _: any,
      { id, amount }: { id: number; amount: number },
      { user }: { user: any }
    ) => {
      if ( !user || !isOwner( user ) ) {
        throw new AuthenticationError(
          "You must be logged in to update store credit."
        );
      }

      // Get current user
      const existingUser = await prisma.user.findUnique( {
        where: { id },
      } );

      if ( !existingUser ) {
        throw new Error( "User not found." );
      }

      // Calculate the new balance
      const newBalance = amount;

      // Log the transaction
      const transactionType =
        newBalance > existingUser.storeCredit ? "credit" : "subtraction";

      // Get the current date and time as a DateTime object
      const currentDateTime = moment().tz( "Europe/London" ).toDate();

      await prisma.storeCreditTransaction.create( {
        data: {
          userId: id,
          type: transactionType,
          amount: Math.abs( amount - existingUser.storeCredit ),
          balanceAfter: newBalance,
          date: currentDateTime, // Use the full DateTime object here
          time: moment( currentDateTime ).format( "HH:mm:ss" ), // Still storing time separately if required
        },
      } );

      // Update the user's store credit
      const updatedUser = await prisma.user.update( {
        where: { id },
        data: { storeCredit: newBalance },
      } );

      return updatedUser;
    },
  },
};

export default resolvers;
