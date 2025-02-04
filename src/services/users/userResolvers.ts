import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server";
import { prisma } from '../../server';
import UserService from '../users';
import { DeleteUserArgs, DeleteUserResponse } from "../../types/user";
import {
  hasRole,
  isAdmin,
  isAdminOrOwner,
  isOwner,
} from "../roles/role-checks";
import SecurityService from "../security";
import RoleService from "../roles";
import { Prisma } from "@prisma/client";

const userResolvers = {
  Query: {
    users: async (
      _: unknown,
      { page = 1, limit = 10, search = "" }: { page: number; limit: number; search: string },
      { user }: any
    ) => {
      if ( !user ) throw new AuthenticationError( "You must be logged in" );
      if ( !isAdminOrOwner( user ) ) throw new AuthenticationError( "Permission denied" );

      try {
        return await UserService.getUsers( page, limit, search );
      } catch ( error ) {
        console.error( "Error in users resolver:", error );
        throw new Error( "Failed to retrieve users" );
      }
    },

    user: async ( _: unknown, args: { id: number }, { user }: any ) => {
      if ( !user ) throw new AuthenticationError( "You must be logged in" );
      if ( !isAdminOrOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await UserService.getUserById( args.id );
    },
  },
  Mutation: {
    registerUser: async ( _: unknown, { input }: { input: any } ) => {
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
        throw new UserInputError( "All fields are required." );
      }

      const existingUser = await prisma.user.findUnique( {
        where: { email: email.toLowerCase() },
      } );
      if ( existingUser ) {
        throw new UserInputError( "Email is already in use." );
      }
      const lowercaseEmail = email.toLowerCase();
      const hashedPassword = await SecurityService.hashPassword( password );

      const user = await prisma.user.create( {
        data: {
          fullname,
          email: lowercaseEmail,
          password: hashedPassword,
          dob: new Date( dob ),
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
      } );
      await UserService.sendVerificationEmail( user.id );
      const userRoles = user.userRoles.map( ( userRole ) => userRole.role.name );

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
        const requestingUser = await UserService.getUserById( requestingUserId );
        if ( !requestingUser )
          throw new AuthenticationError( "You must be logged in" );

        const requestingUserRoles = await RoleService.getRolesByUserId(
          requestingUserId
        );
        requestingUser.roles = requestingUserRoles.map( ( role ) => role.name ); // Add roles to the user object

        // Check if the target user exists and get their roles
        const targetUser = await UserService.getUserById( id );
        if ( !targetUser ) {
          throw new ApolloError(
            `User with ID ${id} does not exist`,
            "USER_NOT_FOUND"
          );
        }

        const targetUserRoles = await RoleService.getRolesByUserId( id );
        targetUser.roles = targetUserRoles.map( ( role ) => role.name ); // Add roles to the user object

        // Determine if deletion is permitted based on roles
        if ( isOwner( requestingUser ) ) {
          // Owner can delete Admin and User accounts
          if ( hasRole( targetUser, "ADMIN" ) || hasRole( targetUser, "USER" ) ) {
            await UserService.deleteUser( id ); // Call the service method to delete user
            return { message: "User account deleted successfully" };
          }
        } else if ( isAdmin( requestingUser ) ) {
          // Admin can delete User accounts
          if ( hasRole( targetUser, "USER" ) ) {
            await UserService.deleteUser( id ); // Call the service method to delete user
            return { message: "User account deleted successfully" };
          }
        } else if ( hasRole( requestingUser, "USER" ) ) {
          // User can only delete their own account
          if ( requestingUserId === id ) {
            await UserService.deleteUser( id ); // Call the service method to delete user
            return { message: "User account deleted successfully" };
          }
        }

        throw new ApolloError(
          "You do not have permission to delete this user",
          "UNAUTHORIZED"
        );
      } catch ( error ) {
        console.error( "Error deleting user:", error );
        if ( error instanceof ApolloError ) {
          throw error;
        }
        throw new ApolloError( "Failed to delete user account", "DELETE_FAILED" );
      }
    },
    createUser: async ( _: any, { input }: any, context: any ) => {
      const { user } = context;

      if ( !user ) {
        throw new Error( "Authentication required" );
      }

      if ( !isAdminOrOwner( user ) )
        throw new AuthenticationError( "Permission denied" );

      const existingUser = await UserService.findUserByEmail(
        input.email.toLowerCase()
      );

      if ( existingUser ) {
        throw new Error( "User with this email already exists" );
      }

      const hashedPassword = await SecurityService.hashPassword( input.password );
      const roles = input.roles?.length
        ? await prisma.role.findMany( {
          where: {
            id: { in: input.roles },
          },
        } )
        : await prisma.role.findMany( { where: { name: "USER" } } );

      try {
        const user = await prisma.user.create( {
          data: {
            fullname: input.fullname,
            address: input.address,
            city: input.city,
            postcode: input.postcode,
            password: hashedPassword,
            email: input.email.toLowerCase(),
            dob: new Date( input.dob ).toISOString(),
            phone: input.phone,
            userRoles: {
              create: roles.map( ( role: any ) => ( {
                role: { connect: { id: role.id } },
              } ) ),
            },
          },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        } );

        return user;
      } catch ( error ) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray( error.meta?.target ) &&
          error.meta?.target.includes( "email" )
        ) {
          throw new Error( "An account with this email already exists" );
        }
        throw new Error( "Failed to create user" );
      }
    },
    updateUser: async (
      _: any,
      args: { id: number; fullname?: string; email?: string; dob?: string },
      context: any
    ) => {
      const { id, fullname, email, dob } = args;

      return await UserService.updateUser( id, {
        fullname,
        email,
        dob,
      } );
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
    ) => {
      const { id, phone, address, city, postcode } = args;
      return await UserService.updateUserAddress( id, {
        phone,
        address,
        city,
        postcode,
      } );
    },

  },
};

export default userResolvers;
