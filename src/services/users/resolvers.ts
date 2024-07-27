import { AuthenticationError, UserInputError } from "apollo-server";
import UserService from ".";
import AuthService from "../auth";
import bcrypt from "bcrypt";

const resolvers = {
  Query: {
    users: async (_: unknown, __: unknown, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!user.admin)
        throw new AuthenticationError(
          "You do not have permission to view this resource"
        );
      return await UserService.getUsers();
    },
    user: async (_: unknown, args: { id: number }, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      return await UserService.getUserById(args.id);
    },
  },
  Mutation: {
    createUser: async (
      _: unknown,
      args: {
        fullname: string;
        email: string;
        password: string;
        dob: string;
        phone: string;
        address: string;
        city: string;
        postcode: string;
        admin: boolean;
      }
    ) => {
      try {
        const user = await UserService.createUser({
          fullname: args.fullname,
          email: args.email,
          password: args.password,
          dob: args.dob,
          phone: args.phone,
          address: args.address,
          city: args.city,
          postcode: args.postcode,
          admin: args.admin,
        });

        return user;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Email is already in use"
        ) {
          throw new UserInputError(error.message);
        }
        throw new Error("Oops! Something went wrong!");
      }
    },

    deleteUser: async (_: unknown, { id }: { id: number }, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (user.id !== id && !user.admin)
        throw new AuthenticationError(
          "You do not have permission to delete this user"
        );
      return await UserService.deleteUser(id);
    },

    updateUser: async (
      _: unknown,
      args: { id: number; data: any },
      { user }: any
    ) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (user.id !== args.id && !user.admin)
        throw new AuthenticationError(
          "You do not have permission to update this user"
        );
      try {
        return await UserService.updateUser(args.id, args.data);
      } catch (error) {
        throw new Error("Failed to update user");
      }
    },

    logoutUser: async (_: unknown, __: unknown, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      return { message: "Logout successful" };
    },

    loginUser: async (
      _: unknown,
      args: { email: string; password: string }
    ) => {
      const user = await UserService.findUserByEmail(args.email);
      if (!user) {
        throw new AuthenticationError("Invalid email or password");
      }

      const isValid = await bcrypt.compare(
        args.password.toLowerCase(),
        user.password
      );
      if (!isValid) {
        throw new AuthenticationError("Invalid email or password");
      }

      const token = AuthService.generateToken({
        id: user.id,
        email: user.email,
        admin: user.admin,
      });
      return { token, user };
    },

    sendVerificationEmail: async (
      _: unknown,
      args: { userId: number },
      { user }: any
    ) => {
      if (!user || (user.id !== args.userId && !user.admin)) {
        throw new AuthenticationError(
          "You do not have permission to send verification email to this user"
        );
      }
      return await UserService.sendVerificationEmail(args.userId);
    },

    verifyEmail: async (_: unknown, args: { token: string }) => {
      try {
        return await UserService.verifyEmail(args.token);
      } catch (error) {
        if (error instanceof Error) {
          throw new UserInputError(error.message);
        }
        throw new Error("Oops! Something went wrong!");
      }
    },

    requestPasswordReset: async (_: unknown, args: { email: string }) => {
      try {
        return await UserService.requestPasswordReset(args.email);
      } catch (error) {
        if (error instanceof Error) {
          throw new UserInputError(error.message);
        }
        throw new Error("Oops! Something went wrong!");
      }
    },

    resetPassword: async (
      _: unknown,
      args: { token: string; newPassword: string }
    ) => {
      try {
        return await UserService.resetPassword(args.token, args.newPassword);
      } catch (error) {
        if (error instanceof Error) {
          throw new UserInputError(error.message);
        }
        throw new Error("Oops! Something went wrong!");
      }
    },

    refreshToken: async (_: unknown, args: { token: string }) => {
      try {
        const newToken = AuthService.refreshToken(args.token);
        return { token: newToken };
      } catch (error) {
        throw new AuthenticationError("Invalid token");
      }
    },
  },
};

export default resolvers;
