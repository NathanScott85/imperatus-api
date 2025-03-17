import { AuthenticationError } from "apollo-server";
import RoleService from "../roles";
import { isOwner } from "../roles/role-checks";

const roleResolvers = {
  Query: {
    getAllRoles: async ( _: unknown, __: unknown, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.getAllRoles();
    },

    getRolesByUserId: async ( _: unknown, { userId }: { userId: number }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.getRolesByUserId( userId );
    },

    getRoleByName: async ( _: unknown, { name }: { name: string }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.getRoleByName( name );
    },

    getUserRoles: async ( _: unknown, { userId }: { userId: number }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.getUserRoles( userId );
    },

    getRoles: async ( _: unknown, { roleId }: { roleId: number }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.getRoles( roleId );
    },
  },

  Mutation: {
    createRole: async ( _: unknown, { name }: { name: string }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.createRole( name );
    },

    deleteRole: async ( _: unknown, { name }: { name: string }, { user }: any ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      await RoleService.deleteRole( name );
      return { message: "Role deleted successfully" };
    },

    assignRoleToUser: async (
      _: unknown,
      { userId, roleName }: { userId: number; roleName: string },
      { user }: any
    ) => {
      if ( !user || !isOwner( user ) )
        throw new AuthenticationError( "Permission denied" );
      return await RoleService.assignRoleToUser( userId, roleName );
    },
  },
};

export default roleResolvers;
