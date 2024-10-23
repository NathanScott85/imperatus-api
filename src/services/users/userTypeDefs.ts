import { gql } from "apollo-server";

const userTypeDefs = gql`
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
    storeCredit: Float!
  }

   type ChangePasswordResponse {
    message: String!
  }

  type ResetResponse {
    message: String!
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

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type VerificationStatus {
    emailVerified: Boolean!
    message: String!
  }

  type PaginatedUsers {
    users: [User!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    users(page: Int, limit: Int, search: String): PaginatedUsers!
    user(id: Int!): User
    getVerificationStatus(userId: Int!): VerificationStatus!
  }

  type Mutation {
    createUser(input: RegisterInput!): User!
    loginUser(email: String!, password: String!): AuthPayload!
    updateUser(id: Int!, fullname: String, email: String, dob: String): User
    updateUserRoles(userId: Int!, roles: [String!]!): User!
    deleteUser(id: Int!): Message!
    sendVerificationEmail(userId: Int!): Message!
    verifyEmail(token: String!): Message!
     registerUser(input: RegisterInput!): User!

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
    updateUserAddress(
      id: Int!
      phone: String
      address: String
      city: String
      postcode: String
    ): User
     refreshToken(refreshToken: String!): AuthPayload!
  }
`;

export default userTypeDefs;
