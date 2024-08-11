import { gql } from "apollo-server";

const typeDefs = gql`
  type User {
    id: Int!
    fullname: String!
    email: String!
    password: String!
    dob: String!
    phone: String!
    address: String!
    city: String!
    postcode: String!
    emailVerified: Boolean
    verificationToken: String
    verificationTokenExpiry: String
    userRoles: [UserRole!]
  }

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

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type Message {
    message: String!
  }

  input UpdateUserInput {
    fullname: String
    email: String
    password: String
    dob: String
    phone: String
    address: String
    city: String
    postcode: String
    admin: Boolean
  }

  input RegisterInput {
    fullname: String!
    email: String!
    password: String!
    dob: String!
    phone: String!
    address: String!
    city: String!
    postcode: String!
    roles: [Int!]
  }

  type ResetResponse {
    message: String!
  }

  type ChangePasswordResponse {
    message: String!
  }

  type VerificationStatus {
    emailVerified: Boolean!
    message: String!
  }

  type Query {
    users: [User!]!
    user(id: Int!): User
    getVerificationStatus(userId: Int!): VerificationStatus!
  }

  type Mutation {
    createUser(input: RegisterInput!): User
    loginUser(email: String!, password: String!): AuthPayload!
    changeUserPassword(
      id: Int!
      newPassword: String!
      oldPassword: String!
    ): ChangePasswordResponse!
    requestPasswordReset(email: String!): ResetResponse!
    resetPassword(
      token: String!
      newPassword: String!
      email: String!
    ): ResetResponse!
    updateUserRoles(userId: Int!, roles: [String!]!): User!
    updateUser(id: Int!, data: UpdateUserInput!): User!
    sendVerificationEmail(userId: Int!): Message!
    verifyEmail(token: String!): Message!
    deleteUser(id: Int!): Message!
    refreshToken(refreshToken: String!): AuthPayload!
    updateUserRole(id: Int!, admin: Boolean!): User!
    logoutUser: Message!
    registerUser(input: RegisterInput!): User!
    createRole(name: String!): Role!
    deleteRole(name: String!): Message!
    assignRoleToUser(userId: Int!, roleName: String!): Message!
  }
`;

export default typeDefs;
