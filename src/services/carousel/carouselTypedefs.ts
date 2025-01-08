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

type CarouselPage {
  id: ID!
  title: String!
  description: String
  img: File
}

type CarouselPages {
  id: ID!
  pages: [CarouselPage!]!
  createdAt: String!
  updatedAt: String!
}

type Query {
  getCarouselPages: [CarouselPages!]!
}

type Mutation {
  createCarouselPage(title: String!, description: String!, img: Upload!): CarouselPage!
}

`;

export default carouselTypeDefs;
