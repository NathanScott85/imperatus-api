import { AuthenticationError, UserInputError } from "apollo-server";
import UserService from ".";
import AuthenticationService from "../authentication";
import AutherisationTokenService from "../token";
import SecurityService from "../security";

const resolvers = {
  Query: {
    users: async (_: unknown, __: unknown, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!user.roles.includes("ADMIN"))
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
        roles: string[];
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
          roles: args.roles,
        });

        return {
          ...user,
          roles: user.roles.map((role: any) => role.role),
        };
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
      if (
        user.id !== id &&
        !user.roles.includes("ADMIN") &&
        !user.roles.includes("OWNER")
      )
        throw new AuthenticationError(
          "You do not have permission to delete this user"
        );
      return await UserService.deleteUser(id);
    },

    updateUserRoles: async (
      _: unknown,
      args: { userId: number; roles: string[] },
      { user }: any
    ) => {
      if (!user || !user.roles.includes("ADMIN"))
        throw new AuthenticationError(
          "You do not have permission to update roles"
        );
      return await UserService.updateUserRoles(args.userId, args.roles);
    },

    updateUser: async (
      _: unknown,
      args: { id: number; data: any },
      { user }: any
    ) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (user.id !== args.id && !user.roles.includes("ADMIN"))
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
      try {
        const { token, user } = await AuthenticationService.loginUser(
          args.email,
          args.password
        );

        return { token, user };
      } catch (error) {
        if (error instanceof Error && error.message.includes("Invalid")) {
          throw new AuthenticationError(error.message);
        }
        throw new Error("Oops! Something went wrong!");
      }
    },

    sendVerificationEmail: async (
      _: unknown,
      args: { userId: number },
      { user }: any
    ) => {
      if (!user || (user.id !== args.userId && !user.roles.includes("ADMIN"))) {
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
        return await AuthenticationService.requestPasswordReset(args.email);
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
        return await AuthenticationService.resetPassword(
          args.token,
          args.newPassword
        );
      } catch (error) {
        if (error instanceof Error) {
          throw new UserInputError(error.message);
        }
        throw new Error("Oops! Something went wrong!");
      }
    },

    refreshToken: async (_: unknown, args: { token: string }) => {
      try {
        const newToken = AutherisationTokenService.refreshToken(args.token);
        return { token: newToken };
      } catch (error) {
        throw new AuthenticationError("Invalid token");
      }
    },
  },
};

export default resolvers;
