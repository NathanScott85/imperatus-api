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

  type Rarity {
    id: ID!
    name: String!
  }

  type CategoryType {
    id: ID!
    name: String!
    categories: [Category!]
  }

  type StockStatus {
    hasInStock: Boolean!
    hasPreorder: Boolean!
    hasOutOfStock: Boolean!
  }

  type Category {
      id: ID!
      name: String!
      slug: String
      description: String
      img: File
      type: CategoryType
      brands: [ProductBrands!]!
      products: [Product!]!
      sets: [ProductSets!]!
      rarities: [Rarity!]  
      stockStatus: StockStatus!
      totalCount: Int!
      totalPages: Int!
      currentPage: Int!
  }

  input CategoryFilters {
      brandId: [Int]
      setId: [Int] 
      rarityId: [Int]
      inStockOnly: Boolean
      outOfStockOnly: Boolean
      preorderOnly: Boolean
  }

  type PaginatedCategories {
    categories: [Category!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllCategories(page: Int, limit: Int, search: String, filters: CategoryFilters): PaginatedCategories!
    getCategoryById(id: ID!, page: Int, limit: Int, filters: CategoryFilters): Category
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
