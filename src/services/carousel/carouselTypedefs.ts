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
  title: String!
  description: String
  img: File
  brand: ProductBrands
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
  getCarouselPages: [CarouselPages!]!
}

type Mutation {
  createCarouselPage(title: String!, description: String, img: Upload! brandId: ID): CarouselPage!
  updateCarouselPage(
    id: ID!
    title: String
    description: String
    img: Upload
    brandId: ID
  ): CarouselPage!
  deleteCarouselPage(id: ID!): DeleteResponse!
}

`;

export default carouselTypeDefs;
