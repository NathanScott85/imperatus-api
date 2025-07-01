import { gql } from "apollo-server";
import productTypeDefs from "../products/productTypeDefs";
import categoryTypeDefs from "../categories/categoriesTypeDefs";
import carouselTypeDefs from "../carousel/carouselTypedefs";
import promotionTypeDefs from "../promotions/promotionsTypeDefs";
import productSetsTypeDefs from "../product-sets/productSetTypeDefs";
import brandsTypeDefs from "../brands/brandsTypedefs";
import productTypesTypeDefs from "../product-type/productTypeTypeDefs";
import rarityTypeDefs from "../card-rarity/cardRarityTypeDefs";
import roleTypeDefs from "../roles/roleTypeDefs";
import variantTypeDefs from "../variants/variantsTypedefs";
import cardTypeDefs from "../card-types/cardTypeTypeDefs";
import ordersTypeDefs from "../orders/ordersTypeDefs";
import discountCodesTypeDefs from "../discount-codes/discountcodeTypeDefs";
import vatTypeDefs from "../vat/vatTypedefs";
import paymentTypeDefs from "../payments/paymentTypedefs";
import settingsTypedefs from "../settings/settingsTypedefs";

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

  type Query {
    users(page: Int, limit: Int, search: String): PaginatedUsers!
    user(id: Int!): User
    getVerificationStatus(userId: Int!): VerificationStatus!
    storeCreditHistory(
      userId: Int!
      limit: Int
      offset: Int
    ): StoreCreditHistoryResponse!
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
    updateUser(id: Int!, fullname: String, email: String, dob: String): User
    updateUserAddress(
      id: Int!
      phone: String
      address: String
      city: String
      postcode: String
    ): User
    sendVerificationEmail(userId: Int!): Message!
    resendVerificationEmail(userId: Int!): Message
    verifyEmail(token: String!): Message!
    deleteUser(id: Int!): Message!
    refreshToken(refreshToken: String!): AuthPayload!
    logoutUser: Message!
    registerUser(input: RegisterInput!): User!
    updateUserStoreCredit(id: Int!, amount: Float!): User!
  }
`;

const combinedTypeDefs = [
  typeDefs,
  productTypeDefs,
  categoryTypeDefs,
  carouselTypeDefs,
  promotionTypeDefs,
  productSetsTypeDefs,
  brandsTypeDefs,
  productTypesTypeDefs,
  rarityTypeDefs,
  roleTypeDefs,
  variantTypeDefs,
  cardTypeDefs,
  ordersTypeDefs,
  discountCodesTypeDefs,
  vatTypeDefs,
  paymentTypeDefs,
  settingsTypedefs,
];

export default combinedTypeDefs;
