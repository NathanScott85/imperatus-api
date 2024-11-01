import { gql } from 'apollo-server';

const cardGameTypeDefs = gql`
  type File {
    id: ID!
    url: String!
    key: String!
    fileName: String!
    contentType: String!
    createdAt: String!
  }

  type ProductType {
    id: ID!
    name: String!
    products: [Product!]!
}

 type Category {
    id: ID!
    name: String!
    description: String
    img: File
    parent: Category
    subCategories: [Category]
    products: [Product] # Product relation within Category
  }

  type CardGame {
    id: ID!
    name: String!
    description: String!
    category: Category!
    img: File
    type: ProductType! # Ensure we are consistent with ProductType enum if necessary
  }

  type Query {
    getAllCardGames: [CardGame!]!
    cardGame(id: ID!): CardGame
     getCardGameById(id: ID!): CardGame
  }

  type Mutation {
    createCardGame(
      name: String!
      description: String!
      img: Upload!
      categoryId: Int!
    ): CardGame!

    updateCardGame(
      id: ID!
      name: String
      description: String
      img: Upload
      categoryId: Int
    ): CardGame!

    deleteCardGame(id: ID!): Message!
  }

  type Message {
    message: String!
  }
`;

export default cardGameTypeDefs;
