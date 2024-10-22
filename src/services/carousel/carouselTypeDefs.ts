import { gql } from "apollo-server";

const carouselTypeDefs = gql`
  type CarouselItem {
    id: Int!
    title: String!
    img: File
    logo: File 
    description: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Mutation {
    createCarouselItem(
        title: String!
        description: String
        image: Upload
        logo: Upload
        isActive: Boolean!
    ): CarouselItem!
}
`;

export default carouselTypeDefs;

