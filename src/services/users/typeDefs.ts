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
    admin: Boolean!
  }

  type AuthPayload {
    token: String!
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

  type Query {
    users: [User!]!
    user(id: Int!): User
    getCurrentUser: User
  }

  type Mutation {
    createUser(
      fullname: String!
      email: String!
      password: String!
      dob: String!
      phone: String!
      address: String!
      city: String!
      postcode: String!
      admin: Boolean!
    ): User!
    loginUser(email: String!, password: String!): AuthPayload!
    requestPasswordReset(email: String!): Message!
    resetPassword(token: String!, newPassword: String!): Message!
    updateUser(id: Int!, data: UpdateUserInput!): User!
    sendVerificationEmail(userId: Int!): Message!
    verifyEmail(token: String!): Message!
    deleteUser(id: Int!): Message!
    refreshToken(token: String!): AuthPayload!
    updateUserRole(id: Int!, admin: Boolean!): User!
  }
`;

export default typeDefs;
