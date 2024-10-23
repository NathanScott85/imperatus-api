import { gql } from "apollo-server";
import userTypeDefs from "../users/userTypeDefs";
import categoryTypeDefs from "../categories/categoryTypeDefs";
import fileTypeDefs from "../file/fileTypeDefs";
import roleTypeDefs from "../roles/roleTypedefs";
import storeCreditTypeDefs from "./storeCreditTypeDefs";
import productTypeDefs from "../products/productTypeDefs"; // Assuming you already have this

const baseTypeDefs = gql`
  type Message {
    message: String!
  }
`;

const combinedTypeDefs = [
  baseTypeDefs,
  userTypeDefs,
  categoryTypeDefs,
  fileTypeDefs,
  roleTypeDefs,
  storeCreditTypeDefs,
  productTypeDefs,
];

export default combinedTypeDefs;
