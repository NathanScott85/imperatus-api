import { gql } from "apollo-server";

const variantTypeDefs = gql`
    type ProductVariant {
        id: ID!
        name: String!
    }

    type PaginatedVariants {
        variants: [ProductVariant!]!
        totalCount: Int!
        totalPages: Int!
        currentPage: Int!
    }

    extend type Query {
        getAllVariants(page: Int, limit: Int, search: String): PaginatedVariants!
    }

    extend type Mutation {
        createVariant(name: String!): ProductVariant  
        updateVariant(id: Int!, name: String!): ProductVariant!
    }
`;

export default variantTypeDefs;
