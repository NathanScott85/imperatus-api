import { gql } from "apollo-server";

const VatTypeDefs = gql`
  type VATRecord {
    id: Int!
    orderId: Int!
    orderNumber: String!
    vatAmount: Float!
    subtotal: Float!
    total: Float!
    createdAt: String!
  }

  type PaginatedVAT {
    vatRecords: [VATRecord!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type VatSummary {
    totalVAT: Float!
  }

  type Query {
    getAllVATRecords(page: Int, limit: Int): PaginatedVAT!
    getTotalVAT: VatSummary!
  }
`;

export default VatTypeDefs;
