import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server";
import UserService from "../users";
import AuthenticationService from "../authentication";
import SecurityService from "../security";
import RoleService from "../roles"; // Import RoleService
import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import { DeleteUserArgs, DeleteUserResponse } from "../../types/user";

const hasRole = (user: any, roleName: string): boolean => {
  if (!user.roles) {
    throw new AuthenticationError("User does not have roles assigned.");
  }

  // Check if the user has the specified role
  return user.roles.includes(roleName);
};

const isAdmin = (user: any) => {
  return hasRole(user, "ADMIN");
};

const isOwner = (user: any) => {
  return hasRole(user, "OWNER");
};

const isAdminOrOwner = (user: any) => {
  return isAdmin(user) || isOwner(user);
};

const resolvers = {
  Query: {
    users: async (_: unknown, __: unknown, { user }: any, context: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");
      return await UserService.getUsers();
    },
    user: async (_: unknown, args: { id: number }, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");
      return await UserService.getUserById(args.id);
    },
  },
  Mutation: {
    registerUser: async (_: unknown, { input }: { input: any }) => {
      const { fullname, email, password, dob, phone, address, city, postcode } =
        input;
      // Validate input data
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

      // Check if the user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        throw new UserInputError("Email is already in use.");
      }
      const lowercaseEmail = email.toLowerCase();
      const hashedPassword = await SecurityService.hashPassword(password);

      // Create the new user in the database
      const user = await prisma.user.create({
        data: {
          fullname,
          email: lowercaseEmail,
          password: hashedPassword,
          dob: new Date(dob), // Ensure dob is a Date type
          phone,
          address,
          city,
          postcode,
          userRoles: {
            create: [
              { role: { connect: { name: "USER" } } }, // Only assign the "USER" role
            ],
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

      // Extract roles
      const userRoles = user.userRoles.map((userRole) => userRole.role.name);

      // Send verification email
      // await UserService.sendVerificationEmail(user.id);

      return { ...user, roles: userRoles };
    },
    deleteUser: async (
      _: unknown,
      args: DeleteUserArgs
    ): Promise<DeleteUserResponse> => {
      const { id } = args;

      try {
        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
          throw new ApolloError(
            `User with ID ${id} does not exist`,
            "USER_NOT_FOUND"
          );
        }

        // Delete associated user roles
        await prisma.userRole.deleteMany({ where: { userId: id } });

        // Delete the user
        await prisma.user.delete({ where: { id } });

        return { message: "User account deleted successfully" };
      } catch (error) {
        console.error("Error deleting user:", error);
        if (error instanceof ApolloError) {
          throw error;
        }
        throw new ApolloError("Failed to delete user account", "DELETE_FAILED");
      }
    },
    requestPasswordReset: async (
      _: any,
      { email }: { email: string },
      context: any
    ) => {
      const { user } = context; // Access the user from the context
      // Check if the user is authenticated
      if (!user) {
        throw new AuthenticationError(
          "You must be logged in to request a password reset."
        );
      }

      // Ensure the logged-in user's email matches the requested email
      if (user.email !== email) {
        throw new AuthenticationError(
          "You can only request a password reset for your own account."
        );
      }

      // Check if the user with the given email exists in the database
      const dbUser = await UserService.findUserByEmail(email);
      if (!dbUser) {
        throw new UserInputError("User with this email does not exist.");
      }

      try {
        // Call the AuthenticationService to handle the reset request
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
      { token, newPassword }: { token: string; newPassword: string },
      context: any
    ) => {
      const { user } = context; // Access the user from the context

      // Check if the user is authenticated
      if (!user) {
        throw new AuthenticationError(
          "You must be logged in to reset your password."
        );
      }
      // pass the token, user email and newpassword to the resetPassword
      try {
        const response = await AuthenticationService.resetPassword(
          token,
          newPassword,
          user.email
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
        // Find the user by the verification token
        const user = await prisma.user.findFirst({
          where: {
            verificationToken: args.token, // Match the verification token
            verificationTokenExpiry: {
              gte: new Date(), // Ensure the token has not expired
            },
          },
        });

        // If no user is found, or if the token is invalid, throw an error
        if (!user) {
          throw new Error("Invalid or expired verification token");
        }

        // Update the user to mark the email as verified
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationToken: null, // Clear the verification token
            verificationTokenExpiry: null, // Clear the expiry date
            emailVerified: true, // Mark the email as verified
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

        // Check if user exists and has a valid email
        if (!user || !user.email) {
          console.error("User not found or email not provided");
          return { message: "User not found or email not provided" };
        }

        // Send the email
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

      // Ensure the user is authenticated
      if (!user) {
        throw new Error("Authentication required");
      }
      // Ensure the user has admin or owner privileges
      if (!isAdminOrOwner(user))
        throw new AuthenticationError("Permission denied");

      // Check if a user with the provided email already exists
      const existingUser = await UserService.findUserByEmail(
        input.email.toLowerCase()
      );

      // If user exists, throw an error
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash the password and determine roles
      const hashedPassword = await SecurityService.hashPassword(input.password);
      const roles = input.roles?.length
        ? await prisma.role.findMany({
            where: {
              id: { in: input.roles },
            },
          })
        : await prisma.role.findMany({ where: { name: "USER" } });

      try {
        // Create the new user with associated roles
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
        // Handle specific Prisma error for duplicate email
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
        const { token, user } = await AuthenticationService.loginUser(
          args.email,
          args.password
        );
        return { token, user };
      } catch (error) {
        throw new AuthenticationError("Invalid email or password");
      }
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
  },
};

export default resolvers;
