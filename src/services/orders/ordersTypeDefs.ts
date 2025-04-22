import { gql } from "apollo-server";

const ordersTypeDefs = gql`
  type OrderStatus {
    id: Int!
    status: String!
    note: String
    createdAt: String!
  }

  type Status {
    id: Int!
    value: String!
    label: String!
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  type Order {
    id: Int!
    firstOrder: Boolean!
    orderNumber: String
    status: String!
    subtotal: Float!
    shippingCost: Float!
    vat: Float!
    total: Float!
    createdAt: String!
    updatedAt: String!
    email: String!
    name: String!
    address: String!
    city: String!
    postcode: String!
    phone: String!
    discountCode: DiscountCode
    trackingNumber: String
    trackingProvider: String
  }

  input OrderItemInput {
    productId: Int!
    quantity: Int!
    price: Float!
  }

  input CreateOrderInput {
    email: String!
    name: String!
    address: String!
    city: String!
    postcode: String!
    phone: String!
    shippingCost: Float!
    items: [OrderItemInput!]!
    discountCode: String
  }

  type PaginatedOrders {
    orders: [Order!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllOrders(page: Int, limit: Int, search: String): PaginatedOrders!
    getAllStatus: [Status!]!
    getAllOrderStatuses(orderId: Int!): [OrderStatus!]!
    getFirstOrder(email: String!): Order
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    createStatus(value: String!, label: String!): Status!
    updateOrderStatus(id: Int!, value: String!, label: String!): Status
    deleteOrderStatus(id: Int!): DeleteResponse!
  }
`;

export default ordersTypeDefs;
