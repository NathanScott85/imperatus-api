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

  type OrderItem {
    id: Int!
    productId: Int!
    quantity: Int!
    price: Float!
    product: Product!
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
    items: [OrderItem!]!
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

  input UpdateOrderInput {
    status: String
    name: String
    address: String
    city: String
    postcode: String
    shippingCost: Float
    phone: String
    email: String
    trackingNumber: String
    trackingProvider: String
    items: [OrderItemInput!]
  }

  type PaginatedOrders {
    orders: [Order!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getAllOrders(page: Int, limit: Int, search: String): PaginatedOrders!
    getOrder(id: Int!): Order!
    getAllStatus: [Status!]!
    getAllOrderStatuses(orderId: Int!): [OrderStatus!]!
    getFirstOrder(email: String!): Order
    isFirstOrder(email: String!): Boolean!
    getUserOrders(
      email: String
      userId: Int
      page: Int
      limit: Int
    ): PaginatedOrders!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrder(id: Int!, input: UpdateOrderInput!): Order!
    createStatus(value: String!, label: String!): Status!
    updateOrderStatus(id: Int!, value: String!, label: String!): Status
    deleteOrderStatus(id: Int!): DeleteResponse!
  }
`;

export default ordersTypeDefs;
