import { gql } from "apollo-server";

const roleTypeDefs = gql`
  type Role {
    id: Int!
    name: String
    users: [User!]!
  }

  type UserRole {
    id: Int!
    user: User!
    role: Role!
  }

  type Message {
    message: String!
  }

 type Query {
    getAllRoles: [Role!]!
    getRolesByUserId(userId: Int!): [Role!]!
    getRoleByName(name: String!): Role
    getUserRoles(userId: Int!): [Role!]!
    getRoles(roleId: Int!): [Role!]!
  }

 type Mutation {
    createRole(name: String!): Role!
    deleteRole(name: String!): Message!
    assignRoleToUser(userId: Int!, roleName: String!): Message!
    updateUserRoles(userId: Int!, roles: [String!]!): User!
}
`

export default roleTypeDefs
