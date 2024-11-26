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
    description: String
    img: File
    type: CategoryType
    products: [Product!]!
  }

  type PaginatedCategories {
    categories: [Category!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllCategories(page: Int, limit: Int): PaginatedCategories!
    getCategoryById(id: ID!): Category
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
