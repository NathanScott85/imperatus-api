import { gql } from "apollo-server";

const productSetsTypeDefs = gql`
type ProductSets {
    id: ID!
    setName: String!
    setCode: String!
    description: String
    brandId: Int!
    brand: ProductBrands!
}

type PaginatedSets {
    sets: [ProductSets]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type Query {
    getAllSets(page: Int, limit: Int, search: String): PaginatedSets!
    getSetsByCategory(categoryId: Int!): [ProductSets!]!
}

type Mutation {
    createProductSet(setName: String, setCode: String, description: String, brandId: Int!): ProductSets
    updateProductSet(id: ID!, setName: String!, setCode: String!, description: String, brandId: Int!): ProductSets!
    deleteSet(id: ID!): Message!
}
`;

export default productSetsTypeDefs;
