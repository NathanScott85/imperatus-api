import { gql } from 'apollo-server';

const cardGameTypeDefs = gql`
  type CardGame {
    id: ID!
    name: String!
    price: Float!
    description: String!
    preorder: Boolean!
    rrp: Float!
    category: Category
    stock: Stock
    img: File
  }

  type Query {
    getAllCardGames: [CardGame!]!    # <-- Define the query here
    cardGame(id: ID!): CardGame
  }

  type Mutation {
      createCardGame(                   # Define the mutation here
      name: String!
      price: Float!
      description: String!
      img: Upload!
      categoryId: Int!
      stock: StockInput!
      preorder: Boolean!
      rrp: Float!
    ): CardGame!

    updateCardGame(
      id: ID!
      name: String
      price: Float
      description: String
      img: Upload
      categoryId: Int
      stock: StockInput
      preorder: Boolean
      rrp: Float
    ): CardGame!

    deleteCardGame(id: ID!): Message!
  }

  input StockInput {
    amount: Int
    sold: Int
    instock: String
    soldout: String
    preorder: String
  }
`;

export default cardGameTypeDefs;
