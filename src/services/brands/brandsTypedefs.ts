import { gql } from "apollo-server";

const brandsTypeDefs = gql`
  type ProductBrands {
    id: ID!
    name: String!
    description: String
    img: File
  }

  type PaginatedBrands {
    brands: [ProductBrands!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllBrands(page: Int, limit: Int, search: String): PaginatedBrands!
    getBrandsByCategory(categoryId: Int!): [ProductBrands!]!
  }

  type Mutation {
    createProductBrand(name: String!, description: String, img: Upload): ProductBrands!
    updateProductBrand(id: ID!, name: String!, description: String, img: Upload): ProductBrands!
    deleteBrand(id: ID!): Message!
  }
`;

export default brandsTypeDefs;
