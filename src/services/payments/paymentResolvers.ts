import PaymentService from ".";

const paymentResolvers = {
  Mutation: {
    createStripePaymentIntent: async (
      _: any,
      {
        input,
      }: {
        input: {
          orderId: number;
          email: string;
          name: string;
          address: string;
          city: string;
          postcode: string;
          phone: string;
          shippingCost: number;
          items: {
            productId: number;
            quantity: number;
            price: number;
          }[];
          discountCode?: string;
        };
      }
    ) => {
      return await PaymentService.createStripePaymentIntent(input);
    },
  },
};

export default paymentResolvers;
