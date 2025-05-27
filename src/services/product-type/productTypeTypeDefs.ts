import { gql } from "apollo-server";

const productTypesTypeDefs = gql`
  type ProductType {
    id: ID!
    name: String!
    products: [Product!]
  }

  input ProductTypeInput {
    name: String!
  }

  type PaginatedTypes { 
    types: [ProductType]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int! 
  }

  type Query {
    getAllProductTypes(page: Int, limit: Int, search: String): PaginatedTypes!
  }

  type Mutation {
    createProductType(input: ProductTypeInput!): ProductType!
    updateProductType(id: Int!, name: String!): ProductType!
    deleteProductType(id: Int!): Message!
  }
`;

export default productTypesTypeDefs;
