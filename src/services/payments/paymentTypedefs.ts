import { gql } from "apollo-server";

const paymentTypeDefs = gql`
  input PaymentItemInput {
    productId: Int!
    quantity: Int!
    price: Float!
  }

  input CreateStripePaymentIntentInput {
    orderId: Int!
    email: String!
    name: String!
    address: String!
    city: String!
    postcode: String!
    phone: String!
    shippingCost: Float!
    items: [PaymentItemInput!]!
    discountCode: String
  }

  type PaymentIntentResponse {
    clientSecret: String!
  }

  extend type Mutation {
    createStripePaymentIntent(
      input: CreateStripePaymentIntentInput!
    ): PaymentIntentResponse!
  }
`;

export default paymentTypeDefs;
