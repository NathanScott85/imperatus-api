import { gql } from "apollo-server";

const roleTypeDefs = gql`
  type Role {
    id: Int!
    name: String!
    users: [User!]!
  }

  type UserRole {
    id: Int!
    user: User!
    role: Role!
  }

  type Mutation {
    createRole(name: String!): Role!
    deleteRole(name: String!): Message!
    assignRoleToUser(userId: Int!, roleName: String!): Message!
  }
`;

export default roleTypeDefs;
