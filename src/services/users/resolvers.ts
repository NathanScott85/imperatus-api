import { AuthenticationError, UserInputError } from "apollo-server";
import UserService from "../users";
import AuthenticationService from "../authentication";
import AuthorizationTokenService from "../token";
import RoleService from "../roles"; // Import RoleService
import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import SecurityService from "../security";

const hasRole = (user: any, roleName: string) => {
  if (!user.userRoles) throw new AuthenticationError(JSON.stringify(user));

  return user.userRoles.some(
    (userRole: any) => userRole.role.name === roleName
  );
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
    users: async (_: unknown, __: unknown, { user }: any) => {
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
    createUser: async (_: any, { input }: any) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
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
