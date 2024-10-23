import { gql } from "apollo-server";

const storeCreditTypeDefs = gql`
  type StoreCreditTransaction {
    date: String!
    time: String!
    type: String!
    amount: Float!
    balanceAfter: Float!
  }

  type StoreCreditHistoryResponse {
    transactions: [StoreCreditTransaction!]!
    totalCount: Int!
  }

  type Mutation {
    updateUserStoreCredit(id: Int!, amount: Float!): User!
  }

  type Query {
    storeCreditHistory(
      userId: Int!
      limit: Int
      offset: Int
    ): StoreCreditHistoryResponse!
  }
`;

export default storeCreditTypeDefs;
