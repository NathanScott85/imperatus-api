import { gql } from "apollo-server";

const categoryTypeDefs = gql`
  type File {
    id: ID!
    url: String!
    key: String!
    fileName: String!
    contentType: String!
    createdAt: String!
  }

  input CategoryTypeInput {
    name: String!
  }

  type CategoryType {
    id: ID!
    name: String!
    categories: [Category!]
  }

  type Category {
      id: ID!
      name: String!
      slug: String
      description: String
      img: File
      type: CategoryType
      products: [Product!]!
      totalCount: Int!
      totalPages: Int!
      currentPage: Int!
  }

  input CategoryFilters {
    brandId: Int
    variantId: Int
    # rarityId: Int
    setId: Int
    productTypeId: Int
    preorder: Boolean
    priceMin: Float
    priceMax: Float
    stockMin: Int
    stockMax: Int
  }

  type Filters {
    brandId: Int
    variantId: Int
    # rarityId: Int
    setId: Int
    productTypeId: Int
    preorder: Boolean
    priceMin: Float
    priceMax: Float
    stockMin: Int
    stockMax: Int
  }
  
  type PaginatedCategories {
    categories: [Category!]!
    filters: Filters
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllCategories(page: Int, limit: Int, search: String, filters: CategoryFilters): PaginatedCategories!
    getCategoryById(id: ID!, page: Int, limit: Int): Category
    getCategoryByName(name: String!): Category
    getAllCategoryTypes: [CategoryType!]!
    getCategoryTypeById(id: String!): CategoryType
  }

  type Mutation {
    createCategory(name: String!, description: String!, img: Upload!): Category!
    createCategoryType(input: ProductTypeInput!): CategoryType!
    updateCategory(id: ID!, name: String, description: String, img: Upload): Category!
    deleteCategory(id: ID!): Message!
  }

  type Message {
    message: String!
  }
`;

export default categoryTypeDefs;
