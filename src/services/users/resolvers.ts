import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server";
import UserService from "../users";
import AuthenticationService from "../authentication";
import SecurityService from "../security";
import RoleService from "../roles"; // Import RoleService
import AuthorizationTokenService from "../token";
import CategoriesService from "../categories";
import { DeleteUserArgs, DeleteUserResponse } from "../../types/user";
import {
  hasRole,
  isAdmin,
  isAdminOrOwner,
  isOwner,
} from "../roles/role-checks";
import moment from "moment-timezone";
import { GraphQLUpload } from "graphql-upload-ts";

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    users: async (
      _: unknown,
      {
        page = 1,
        limit = 10,
        search = "",
      }: { page: number; limit: number; search: string },
      { user }: any,
      context: any
    ) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");

      const offset = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              {
                fullname: {
                  contains: search.toLowerCase(),
                },
              },
              {
                email: {
                  contains: search.toLowerCase(),
                },
              },
            ],
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
          skip: offset,
          take: limit,
        }),
        prisma.user.count({
          where: {
            OR: [
              {
                fullname: {
                  contains: search.toLowerCase(),
                },
              },
              {
                email: {
                  contains: search.toLowerCase(),
                },
              },
            ],
          },
        }),
      ]);

      const formattedUsers = users.map((user) => ({
        ...user,
        dob: user.dob ? moment(user.dob).format("YYYY-MM-DD") : null,
      }));

      return {
        users: formattedUsers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },

    user: async (_: unknown, args: { id: number }, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");
      return await UserService.getUserById(args.id);
    },

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

    categories: async () => {
      return await CategoriesService.getAllCategories();
    },

    category: async (_: any, args: any) => {
      return await CategoriesService.getCategoryById(args.id);
    },
    products: async (
      _: unknown,
      { page = 1, limit = 10 }: { page: number; limit: number },
      { user }: any
    ) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");

      const offset = (page - 1) * limit;

      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          skip: offset,
          take: limit,
          include: {
            category: true,
            stock: true,
          },
        }),
        prisma.product.count(),
      ]);

      return {
        products, // This should be a list of Product objects
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },

    product: async (_: any, args: any) => {
      return await prisma.product.findUnique({
        where: { id: parseInt(args.id) },
        include: {
          stock: true,
        },
      });
    },
  },

  Category: {
    products: async (parent: any) => {
      return await prisma.product.findMany({
        where: { categoryId: parent.id },
      });
    },
  },

  Product: {
    stock: async (parent: any) => {
      return await prisma.stock.findUnique({
        where: { productId: parent.id },
      });
    },
  },
  Mutation: {
    registerUser: async (_: unknown, { input }: { input: any }) => {
      const { fullname, email, password, dob, phone, address, city, postcode } =
        input;

      if (
        !fullname ||
        !email ||
        !password ||
        !dob ||
        !phone ||
        !address ||
        !city ||
        !postcode
      ) {
        throw new UserInputError("All fields are required.");
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        throw new UserInputError("Email is already in use.");
      }
      const lowercaseEmail = email.toLowerCase();
      const hashedPassword = await SecurityService.hashPassword(password);

      const user = await prisma.user.create({
        data: {
          fullname,
          email: lowercaseEmail,
          password: hashedPassword,
          dob: new Date(dob),
          phone,
          address,
          city,
          postcode,
          userRoles: {
            create: [{ role: { connect: { name: "USER" } } }],
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      await UserService.sendVerificationEmail(user.id);
      const userRoles = user.userRoles.map((userRole) => userRole.role.name);

      return { ...user, roles: userRoles };
    },
    deleteUser: async (
      _: unknown,
      args: DeleteUserArgs,
      context: any
    ): Promise<DeleteUserResponse> => {
      const { id } = args;
      const requestingUserId = context.user.id; // Assuming context contains the requesting user's info

      try {
        // Check if the requesting user exists and get their roles
        const requestingUser = await UserService.getUserById(requestingUserId);
        if (!requestingUser)
          throw new AuthenticationError("You must be logged in");

        const requestingUserRoles = await RoleService.getRolesByUserId(
          requestingUserId
        );
        requestingUser.roles = requestingUserRoles.map((role) => role.name); // Add roles to the user object

        // Check if the target user exists and get their roles
        const targetUser = await UserService.getUserById(id);
        if (!targetUser) {
          throw new ApolloError(
            `User with ID ${id} does not exist`,
            "USER_NOT_FOUND"
          );
        }

        const targetUserRoles = await RoleService.getRolesByUserId(id);
        targetUser.roles = targetUserRoles.map((role) => role.name); // Add roles to the user object

        // Determine if deletion is permitted based on roles
        if (isOwner(requestingUser)) {
          // Owner can delete Admin and User accounts
          if (hasRole(targetUser, "ADMIN") || hasRole(targetUser, "USER")) {
            await UserService.deleteUser(id); // Call the service method to delete user
            return { message: "User account deleted successfully" };
          }
        } else if (isAdmin(requestingUser)) {
          // Admin can delete User accounts
          if (hasRole(targetUser, "USER")) {
            await UserService.deleteUser(id); // Call the service method to delete user
            return { message: "User account deleted successfully" };
          }
        } else if (hasRole(requestingUser, "USER")) {
          // User can only delete their own account
          if (requestingUserId === id) {
            await UserService.deleteUser(id); // Call the service method to delete user
            return { message: "User account deleted successfully" };
          }
        }

        throw new ApolloError(
          "You do not have permission to delete this user",
          "UNAUTHORIZED"
        );
      } catch (error) {
        console.error("Error deleting user:", error);
        if (error instanceof ApolloError) {
          throw error;
        }
        throw new ApolloError("Failed to delete user account", "DELETE_FAILED");
      }
    },

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
      // Ensure the provided email exists in the database
      const dbUser = await UserService.findUserByEmail(email);
      if (!dbUser) {
        throw new UserInputError("User with this email does not exist.");
      }

      try {
        // Proceed to request a password reset
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
        const user = await prisma.user.findFirst({
          where: {
            verificationToken: args.token,
            verificationTokenExpiry: {
              gte: new Date(),
            },
          },
        });

        if (!user) {
          throw new Error("Invalid or expired verification token");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationToken: null,
            verificationTokenExpiry: null,
            emailVerified: true,
          },
        });

        return { message: "Email verified successfully." };
      } catch (error) {
        console.error("Verification failed:", error);
        return { message: "Failed to verify email. Please try again later." };
      }
    },

    async sendVerificationEmail(_: any, { userId }: any) {
      try {
        const user = await UserService.getUserById(userId);

        if (!user || !user.email) {
          console.error("User not found or email not provided");
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
        console.error("Error in sendVerificationEmail:", error);
        return {
          message: "An error occurred while sending the verification email.",
        };
      }
    },

    createUser: async (_: any, { input }: any, context: any) => {
      const { user } = context;

      if (!user) {
        throw new Error("Authentication required");
      }

      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");

      const existingUser = await UserService.findUserByEmail(
        input.email.toLowerCase()
      );

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const hashedPassword = await SecurityService.hashPassword(input.password);
      const roles = input.roles?.length
        ? await prisma.role.findMany({
            where: {
              id: { in: input.roles },
            },
          })
        : await prisma.role.findMany({ where: { name: "USER" } });

      try {
        const user = await prisma.user.create({
          data: {
            fullname: input.fullname,
            address: input.address,
            city: input.city,
            postcode: input.postcode,
            password: hashedPassword,
            email: input.email.toLowerCase(),
            dob: new Date(input.dob).toISOString(),
            phone: input.phone,
            userRoles: {
              create: roles.map((role: any) => ({
                role: { connect: { id: role.id } },
              })),
            },
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        return user;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta?.target.includes("email")
        ) {
          throw new Error("An account with this email already exists");
        }
        throw new Error("Failed to create user");
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
          AuthorizationTokenService.refreshToken(accessToken);

        return { accessToken, user, refreshToken };
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

    updateUser: async (
      _: any,
      args: { id: number; fullname?: string; email?: string; dob?: string },
      context: any
    ) => {
      const { id, fullname, email, dob } = args;

      return await UserService.updateUser(id, {
        fullname,
        email,
        dob,
      });
    },
    updateUserAddress: async (
      _: any,
      args: {
        id: number;
        phone?: string;
        address?: string;
        city?: string;
        postcode?: string;
      },
      context: any
    ) => {
      const { id, phone, address, city, postcode } = args;
      return await UserService.updateUserAddress(id, {
        phone,
        address,
        city,
        postcode,
      });
    },

    refreshToken: async (_: unknown, { refreshToken }: any) => {
      return await AuthorizationTokenService.refreshToken(refreshToken);
    },

    createRole: async (_: unknown, args: { name: string }, { user }: any) => {
      if (!user || !isOwner(user))
        throw new AuthenticationError("Permission denied");
      return await RoleService.createRole(args.name);
    },

    deleteRole: async (_: unknown, args: { name: string }, { user }: any) => {
      if (!user || !isOwner(user))
        throw new AuthenticationError("Permission denied");
      await RoleService.deleteRole(args.name);
      return { message: "Role deleted successfully" };
    },

    updateUserRoles: async (
      _: unknown,
      args: { userId: number; roles: string[] },
      { user }: any
    ) => {
      if (!user || !isOwner(user))
        throw new AuthenticationError(
          "You do not have permission to update roles"
        );
      return await UserService.updateUserRoles(args.userId, args.roles);
    },

    assignRoleToUser: async (
      _: unknown,
      { userId, roleName }: { userId: number; roleName: string },
      { user }: any
    ) => {
      if (!user || !isOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }
      return await RoleService.assignRoleToUser(userId, roleName);
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

      // Get current user
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new Error("User not found.");
      }

      // Calculate the new balance
      const newBalance = amount;

      // Log the transaction
      const transactionType =
        newBalance > existingUser.storeCredit ? "credit" : "subtraction";

      // Get the current date and time as a DateTime object
      const currentDateTime = moment().tz("Europe/London").toDate();

      await prisma.storeCreditTransaction.create({
        data: {
          userId: id,
          type: transactionType,
          amount: Math.abs(amount - existingUser.storeCredit),
          balanceAfter: newBalance,
          date: currentDateTime, // Use the full DateTime object here
          time: moment(currentDateTime).format("HH:mm:ss"), // Still storing time separately if required
        },
      });

      // Update the user's store credit
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { storeCredit: newBalance },
      });

      return updatedUser;
    },
    createCategory: async (_: any, { name, description, img }: any) => {
      return await CategoriesService.createCategory(name, description, img);
    },

    deleteCategory: async (
      _: unknown,
      args: { id: string },
      context: any
    ): Promise<{ message: string }> => {
      const { id } = args;
      const requestingUserId = context.user.id;

      try {
        const requestingUser = await prisma.user.findUnique({
          where: { id: requestingUserId },
          include: { userRoles: { include: { role: true } } },
        });

        if (!requestingUser) {
          throw new AuthenticationError("You must be logged in");
        }

        const roles = requestingUser.userRoles.map(
          (userRole) => userRole.role.name
        );

        if (!roles.includes("OWNER")) {
          throw new AuthenticationError(
            "You do not have permission to delete this category"
          );
        }

        return await CategoriesService.deleteCategory(id);
      } catch (error) {
        console.error("Error in deleteCategory resolver:", error);
        throw error;
      }
    },
  },
};

export default resolvers;
