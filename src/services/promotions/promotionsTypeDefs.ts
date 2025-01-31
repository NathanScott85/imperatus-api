import { gql } from 'apollo-server';

const promotionTypeDefs = gql`
    type Promotion {
      id: ID!
      title: String!
      description: String!
      img: File
      slug: String!
      startDate: String!
      endDate: String!
      createdAt: String!
      updatedAt: String!
    }

    type File {
        id: ID!
        url: String!
        key: String!
        fileName: String!
        contentType: String!
        createdAt: String!
    }

    type PaginatedPromotions {
        promotions: [Promotion!]!
        totalCount: Int!
        totalPages: Int!
        currentPage: Int!
    }

    type Query {
      getAllPromotions(page: Int, limit: Int, search: String): PaginatedPromotions!
    }

    type Mutation {
      createPromotion(
        title: String!
        description: String!
        img: Upload
        startDate: String!
        endDate: String!
      ): Promotion!

      updatePromotion(
            id: ID!
            title: String!
            description: String!
            img: Upload
            startDate: String!
            endDate: String!
      ): Promotion!
        deletePromotion(id: ID!): Boolean!
    }
`
export default promotionTypeDefs;