import { gql } from "apollo-server";

const productTypeDefs = gql`
  type Product {
    id: ID!
    category: Category!
    name: String!
    img: File
    price: Float!
    type: String
    rrp: Float
    description: String
    stock: Stock
    preorder: Boolean!
  }

  type Stock {
    id: ID!
    amount: Int!
    sold: Int!
    instock: String!
    soldout: String!
    preorder: String!
  }

  type PaginatedProducts {
    products: [Product!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  input StockInput {
    amount: Int!
    sold: Int!
    instock: String!
    soldout: String!
    preorder: String!
  }

  type Query {
    product(id: ID!): Product
    products(page: Int, limit: Int): PaginatedProducts!
  }

  type Mutation {
    createProduct(
      name: String!
      price: Float!
      type: String!
      description: String
      img: Upload
      categoryId: Int!
      stock: StockInput!
      preorder: Boolean!
      rrp: Float
    ): Product!

    updateProduct(
      id: ID!
      name: String
      price: Float
      type: String
      description: String
      img: Upload
      categoryId: Int # Change this to Int
      stockAmount: Int
      stockSold: Int
      stockInstock: String
      stockSoldout: String
      stockPreorder: String
      preorder: Boolean
      rrp: Float
    ): Product!

    deleteProduct(id: ID!): Message!
  }
`;

export default productTypeDefs;
