import { gql } from "apollo-server";

const cardTypeDefs = gql`
    type CardType {
        id: ID!
        name: String!
        brandId: ID!
        brand: ProductBrands!
    }

    type PaginatedCardTypes { 
        cardTypes: [CardType]!
        totalCount: Int!
        totalPages: Int!
        currentPage: Int! 
    }

    type Query {
        getAllCardTypes(page: Int, limit: Int, search: String): PaginatedCardTypes!
    }

    type Mutation {
        createCardType(name: String!, brandId: Int): CardType
        updateCardType(id: Int!, name: String!, brandId: Int!): CardType
        deleteCardType(id: ID!): Message!
    }
`;

export default cardTypeDefs;
