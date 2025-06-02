import { gql } from "apollo-server";

const ShippingTypeDefs = gql`
  type ShippingProvider {
    id: Int!
    name: String!
    createdAt: String!
    updatedAt: String!
    options: [ShippingOption!]!
  }

  type ShippingOption {
    id: Int!
    name: String!
    cost: Float!
    estimatedDays: Int!
    description: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    provider: ShippingProvider!
  }

  type PaginatedShippingOptions {
    options: [ShippingOption!]!
    total: Int!
    page: Int!
    pages: Int!
  }

  type PaginatedShippingProviders {
    providers: [ShippingProvider!]!
    total: Int!
    page: Int!
    pages: Int!
  }

  type Query {
    getAllShippingOptions(
      page: Int
      limit: Int
      search: String
    ): PaginatedShippingOptions!
    getAllShippingProviders(
      page: Int
      limit: Int
      search: String
    ): PaginatedShippingProviders!
  }

  type Mutation {
    createShippingProvider(name: String!): ShippingProvider!
    createShippingOption(
      name: String!
      cost: Float!
      estimatedDays: Int!
      description: String
      isActive: Boolean!
      providerId: Int!
    ): ShippingOption!
    updateShippingOption(
      id: Int!
      name: String
      cost: Float
      estimatedDays: Int
      description: String
      isActive: Boolean
      providerId: Int
    ): ShippingOption!
    updateShippingProvider(id: Int!, name: String!): ShippingProvider!
  }
`;

export default ShippingTypeDefs;
