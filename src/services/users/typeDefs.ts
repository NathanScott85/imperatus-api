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
    storeCredit: Float!
  }

  scalar Upload

  type File {
    id: ID!
    url: String!
    key: String!
    fileName: String!
    contentType: String!
    createdAt: String!
  }

  type Category {
    id: ID!
    name: String!
    description: String!
    img: File
    products: [Product!]!
  }

  type Product {
    id: ID!
    category: Category!
    cardgame: String
    name: String!
    img: File
    price: Float!
    type: String
    rrp: Float
    description: String
    stock: Stock
  }

  type Stock {
    id: ID!
    amount: Int!
    sold: Int!
    instock: String!
    soldout: String!
    preorder: String!
  }

  type StoreCreditTransaction {
    date: String!
    time: String!
    type: String!
    amount: Float!
    balanceAfter: Float!
  }

  type StoreCreditHistoryResponse {
    transactions: [StoreCreditTransaction!]!
    totalCount: Int!
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

  type PaginatedUsers {
    users: [User!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type PaginatedProducts {
    products: [Product!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    users(page: Int, limit: Int, search: String): PaginatedUsers!
    user(id: Int!): User
    getVerificationStatus(userId: Int!): VerificationStatus!
    storeCreditHistory(
      userId: Int!
      limit: Int
      offset: Int
    ): StoreCreditHistoryResponse!
    categories: [Category!]!
    category(id: ID!): Category
    product(id: ID!): Product
    products(page: Int, limit: Int): PaginatedProducts!
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
    updateUser(id: Int!, fullname: String, email: String, dob: String): User
    updateUserAddress(
      id: Int!
      phone: String
      address: String
      city: String
      postcode: String
    ): User
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
    updateUserStoreCredit(id: Int!, amount: Float!): User!
    createCategory(name: String!, description: String!, img: Upload!): Category!
    createProduct(
      name: String!
      price: Float!
      type: String!
      description: String
      img: Upload
    ): Product!
  }
`;

export default typeDefs;
