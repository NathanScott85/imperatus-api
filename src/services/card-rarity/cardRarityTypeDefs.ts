import { gql } from "apollo-server";

const rarityTypeDefs = gql`

type Rarity {
    id: ID!
    name: String!
}

type PaginatedRarities {
    rarities: [Rarity!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type Query {
    getAllRarity(page: Int, limit: Int, search: String): PaginatedRarities!
}

type Mutation {
    createRarity(name: String!): Rarity 
    updateRarity(id: Int!, name: String!): Rarity!
}

`;

export default rarityTypeDefs;