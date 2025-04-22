import { gql } from "apollo-server";

const discountCodesTypeDefs = gql`
  type DiscountCode {
    id: Int!
    code: String!
    description: String
    type: String!
    value: Float!
    active: Boolean!
    expiresAt: String
    createdAt: String!
    updatedAt: String!
  }

  input CreateDiscountCodeInput {
    code: String!
    description: String
    type: String!
    value: Float!
    active: Boolean
    expiresAt: String
  }

  input UpdateDiscountCodeInput {
    id: Int!
    code: String
    description: String
    type: String
    value: Float
    expiresAt: String
    active: Boolean
  }

  type PaginatedDiscountCodes {
    discountCodes: [DiscountCode!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllDiscountCodes(
      page: Int
      limit: Int
      search: String
    ): PaginatedDiscountCodes!
    getDiscountCodeByCode(code: String!): DiscountCode
    getDiscountCodeById(id: Int!): DiscountCode
  }

  type Mutation {
    createDiscountCode(input: CreateDiscountCodeInput!): DiscountCode!
    updateDiscountCode(
      id: Int!
      code: String
      description: String
      type: String
      value: Float
      expiresAt: String
      active: Boolean
    ): DiscountCode
    deleteDiscountCode(id: Int!): Boolean!
  }
`;

export default discountCodesTypeDefs;
