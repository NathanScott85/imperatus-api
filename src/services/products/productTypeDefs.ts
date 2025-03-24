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
    set: ProductSets
    slug: String
    brand: ProductBrands!
    preorder: Boolean!
    rarities: [Rarity!]!
    variant: ProductVariant
    cardType: CardType
  }

input ProductFilters {
    brandId: Int
    setId: Int
    variantId: Int
    rarityIds: [Int]
    cardTypeId: Int
    productTypeId: Int
    priceMin: Float
    priceMax: Float
    preorder: Boolean
    stockMin: Int
    stockMax: Int
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

type PaginatedRarities {
    rarities: [Rarity!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
}

type Query {
    getAllProducts(
      page: Int
      limit: Int
      search: String
      filters: ProductFilters
    ): PaginatedProducts!
    getProductById(id: ID!): Product
    getLatestProducts: [Product!]!
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
   createProduct(
        name: String!
        price: Float!
        productTypeId: Int
        brandId: Int
        setId: Int
        description: String
        img: Upload
        categoryId: Int
        cardTypeId: Int
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
    deleteProduct(id: ID!): Message!
}

`;

export default productTypeDefs;
