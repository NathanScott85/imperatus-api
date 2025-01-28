import { gql } from 'apollo-server';

const promotionTypeDefs = gql`
    type Promotion {
      id: ID!
      title: String!
      description: String!
      imageUrl: String!
      slug: String!
      startDate: String!
      endDate: String!
      createdAt: String!
      updatedAt: String!
    }

    type PaginatedPromotions {
      promotions: [Promotion!]!
      totalCount: Int!
      totalPages: Int!
      currentPage: Int!
    }

    type Query {
      getAllPromotions(page: Int, limit: Int): PaginatedPromotions!
    }
`
export default promotionTypeDefs;