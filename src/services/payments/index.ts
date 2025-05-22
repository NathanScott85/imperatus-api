import Stripe from "stripe";
import { prisma } from "../../server";
import { calculateDiscount } from "../orders/order-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

class PaymentService {
  async createStripePaymentIntent({
    orderId,
    email,
    name,
    address,
    city,
    postcode,
    phone,
    shippingCost,
    items,
    discountCode,
  }: {
    orderId: number;
    email: string;
    name: string;
    address: string;
    city: string;
    postcode: string;
    phone: string;
    shippingCost: number;
    items: { productId: number; quantity: number; price: number }[];
    discountCode?: string;
  }) {
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { stock: true },
        });

        if (!product?.price || product.price.toNumber() !== item.price) {
          throw new Error(`Invalid price for product ID ${item.productId}`);
        }

        return {
          ...item,
          preorder: product.preorder,
        };
      })
    );

    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const user = await prisma.user.findUnique({ where: { email } });

    const { discountValue } = await calculateDiscount({
      userId: user?.id,
      email,
      subtotal,
      discountCode,
    });

    const discountedSubtotal = Math.max(subtotal - discountValue, 0);
    const total = discountedSubtotal + shippingCost;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "gbp",
      shipping: {
        name,
        address: {
          line1: address,
          city,
          postal_code: postcode,
          country: "GB",
        },
        phone,
      },
      metadata: {
        email,
        name,
        address,
        city,
        postcode,
        phone,
        orderId: orderId.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }
}

export default new PaymentService();
