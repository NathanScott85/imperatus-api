import { gql } from "apollo-server";

const categoryTypeDefs = gql`
  # File type definition, shared with products
  type File {
    id: ID!
    url: String!
    key: String!
    fileName: String!
    contentType: String!
    createdAt: String!
  }

  # Individual Category type definition
  type Category {
    id: ID!
    name: String!
    description: String
    img: File
    products: [Product!]! # Product relation within Category
  }

  type PaginatedCategories {
    categories: [Category!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}


  # Queries and Mutations for Categories
  type Query {
    getAllCategories(page: Int, limit: Int): PaginatedCategories!
    getCategoryById(id: ID!): Category
    getCategoryByName(name: String!): Category
  }

  type Mutation {
    createCategory(name: String!, description: String!, img: Upload!): Category!
    updateCategory(id: ID!, name: String, description: String, img: Upload): Category!
    deleteCategory(id: ID!): Message!
  }

  # Message type for deletions
  type Message {
    message: String!
  }
`;

export default categoryTypeDefs;
