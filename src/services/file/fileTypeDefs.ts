import { gql } from "apollo-server";

const fileTypeDefs = gql`
  scalar Upload

  type File {
    id: ID!
    url: String!
    key: String!
    fileName: String!
    contentType: String!
    createdAt: String!
  }
`;

export default fileTypeDefs;
