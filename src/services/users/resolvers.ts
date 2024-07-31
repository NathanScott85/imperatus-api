import { AuthenticationError, UserInputError } from "apollo-server";
import UserService from "../users";
import AuthenticationService from "../authentication";
import AuthorizationTokenService from "../token";
import RoleService from "../roles"; // Import RoleService

const resolvers = {
  Query: {
    users: async (_: unknown, __: unknown, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      if (!user.roles.includes("ADMIN"))
        throw new AuthenticationError("Permission denied");
      return await UserService.getUsers();
    },
    user: async (_: unknown, args: { id: number }, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      return await UserService.getUserById(args.id);
    },
    roles: async (_: unknown, __: unknown, { user }: any) => {
      if (!user) throw new AuthenticationError("You must be logged in");
      return await RoleService.getAllRoles();
    },
  },
  Mutation: {
    registerUser: async (_: unknown, { input }: any) => {
      try {
        const user = await UserService.createUser(input);
        await UserService.sendVerificationEmail(user.id);
        return user;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Email is already in use"
        ) {
          throw new UserInputError(error.message);
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
      if (!user || !user.roles.includes("ADMIN"))
        throw new AuthenticationError("Permission denied");
      return await RoleService.createRole(args.name);
    },
    deleteRole: async (_: unknown, args: { name: string }, { user }: any) => {
      if (!user || !user.roles.includes("ADMIN"))
        throw new AuthenticationError("Permission denied");
      await RoleService.deleteRole(args.name);
      return { message: "Role deleted successfully" };
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
    assignRoleToUser: async (
      _: unknown,
      { userId, roleName }: { userId: number; roleName: string },
      { user }: any
    ) => {
      if (!user || !user.roles.includes("ADMIN")) {
        throw new AuthenticationError("Permission denied");
      }
      return await RoleService.assignRoleToUser(userId, roleName);
    },
    // Other mutations remain unchanged
  },
};

export default resolvers;
