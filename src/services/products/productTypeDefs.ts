import { gql } from "apollo-server";

const productTypeDefs = gql`

type Product {
    id: ID!
    category: Category!
    name: String!
    img: File
    price: Float!
    type: ProductType!
    rrp: Float
    description: String
    stock: Stock
    set: ProductSets!
    slug: String
    brand: ProductBrands!
    preorder: Boolean!
    rarities: [Rarity!]!
    variant: ProductVariant
}

type Rarity {
    id: ID!
    name: String!
}

type ProductVariant {
    id: ID!
    name: String!
}

scalar Upload

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
    products: [Product!]
}

input ProductTypeInput {
    name: String!
}

type Stock {
    id: ID!
    amount: Int!
    sold: Int!
    instock: String!
    soldout: String!
    preorder: Boolean!
}

type PaginatedProducts {
    products: [Product!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type ProductBrands {
    id: ID!
    name: String!
    description: String
    img: File
}

type PaginatedBrands {
    brands: [ProductBrands!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type PaginatedSets {
    sets: [ProductSets]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type PaginatedRarities {
    rarities: [Rarity!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type PaginatedVariants {
    variants: [ProductVariant!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type ProductSets {
    id: ID!
    setName: String!
    setCode: String!
    description: String
}

type PaginatedTypes { 
    types: [ProductType]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int! 
}

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
    getAllProducts(page: Int, limit: Int, search: String): PaginatedProducts!
    getAllProductTypes(page: Int, limit: Int, search: String): PaginatedTypes!
    getAllBrands(page: Int, limit: Int, search: String): PaginatedBrands!
    getAllSets(page: Int, limit: Int, search: String): PaginatedSets!
    getAllRarity(page: Int, limit: Int, search: String): PaginatedRarities!
    getAllVariants(page: Int, limit: Int, search: String): PaginatedVariants!
    getAllCardTypes(page: Int, limit: Int, search: String): PaginatedCardTypes!
    getProductById(id: ID!): Product
}

type Message {
    message: String!
}

input StockInput {
    amount: Int!
    sold: Int!
    instock: String!
    soldout: String!
    preorder: Boolean!
}

type Mutation {
   createProductType(input: ProductTypeInput!): ProductType!
   createProductBrand(name: String, description: String, img: Upload): ProductBrands
   createProductSet(setName: String, setCode: String, description: String): ProductSets
   createRarity(name: String!): Rarity 
   createVariant(name: String!): ProductVariant  
   createCardType(name: String!, brandId: Int): CardType
   createProduct(
        name: String!
        price: Float!
        productTypeId: Int
        brandId: Int
        setId: Int
        description: String
        img: Upload
        categoryId: Int
        stock: StockInput
        preorder: Boolean!
        rrp: Float
    ): Product
    updateProduct(
        id: ID!
        name: String
        price: Float
        productTypeId: Int!
        categoryId: Int
        description: String
        img: Upload
        stockAmount: Int
        stockSold: Int
        stockInstock: String
        stockSoldout: String
        stockPreorder: Boolean
        preorder: Boolean
        rrp: Float
        variantId: Int
        rarityIds: [Int]
    ): Product!
    updateProductType(id: Int!, name: String!): ProductType!
    updateProductBrand(id: ID!, name: String!, description: String, img: Upload): ProductBrands!
    updateProductSet(id: ID!, setName: String!, setCode: String!, description: String): ProductSets!
    updateVariant(id: Int!, name: String!): ProductVariant!
    updateRarity(id: Int!, name: String!): Rarity!
    updateCardType(id: Int!, name: String!, brandId: Int!): CardType
    deleteProduct(id: ID!): Message!
    deleteBrand(id: ID!): Message!
    deleteSet(id: ID!): Message!
    deleteCardType(id: ID!): Message!
}

`;

export default productTypeDefs;
