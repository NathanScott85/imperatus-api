import { gql } from "apollo-server";

const categoryTypeDefs = gql`
  type Category {
    id: ID!
    name: String!
    description: String!
    img: File
    products: [Product!]!
  }

  type Query {
    categories: [Category!]!
    category(id: ID!): Category
    getCategoryByName(name: String!): Category
  }

  type Mutation {
    createCategory(name: String!, description: String!, img: Upload!): Category!
    updateCategory(
      id: String!
      name: String
      description: String
      img: Upload
    ): Category
    deleteCategory(id: ID!): Message!
  }
`;

export default categoryTypeDefs;
