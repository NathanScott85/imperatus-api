import { gql } from "apollo-server";

const carouselTypeDefs = gql`
  type File {
    id: ID!
    url: String!
    key: String!
    fileName: String!
    contentType: String!
    createdAt: String!
  }

  type ProductBrands {
    id: ID!
    name: String!
    description: String
    img: File
  }

  type CarouselPage {
    id: ID!
    title: String
    description: String
    buttonText: String
    img: File
    disabled: Boolean
    brand: ProductBrands
    product: Product
  }

  type PaginatedCarouselPages {
    carouselPages: [CarouselPages!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type CarouselPages {
    id: ID!
    pages: [CarouselPage!]!
    createdAt: String!
    updatedAt: String!
  }

  type DeleteResponse {
    message: String!
    deletedPage: CarouselPage
  }

  type Query {
    getCarouselPages(
      page: Int
      limit: Int
      search: String
    ): PaginatedCarouselPages!
  }

  type Mutation {
    createCarouselPage(
      title: String
      description: String
      buttonText: String
      img: Upload
      brandId: ID
      productId: ID
      disabled: Boolean
    ): CarouselPage!
    updateCarouselPage(
      id: ID!
      title: String
      description: String
      buttonText: String
      img: Upload
      brandId: ID
      productId: ID
      disabled: Boolean
    ): CarouselPage!
    deleteCarouselPage(id: ID!): DeleteResponse!
  }
`;

export default carouselTypeDefs;
