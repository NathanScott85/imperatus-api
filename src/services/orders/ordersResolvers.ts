import OrderService from "../../services/orders";

const ordersResolvers = {
  Query: {
    getAllOrders: async (
      _: any,
      {
        page,
        limit,
        search,
      }: { page?: number; limit?: number; search?: string }
    ) => {
      return OrderService.getAllOrders(page, limit, search);
    },
    getAllStatus: async () => {
      return OrderService.getAllStatus();
    },
    getAllOrderStatuses: async (_: any, { orderId }: { orderId: number }) => {
      return OrderService.getAllOrderStatuses(orderId);
    },
    getFirstOrder: async (_: any, { email }: { email: string }) => {
      return OrderService.getFirstOrder(email);
    },
  },

  Mutation: {
    createOrder: async (
      _: any,
      {
        input,
      }: {
        input: {
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
      return OrderService.createOrder(input);
    },
    updateOrder: async (_: any, { id, input }: { id: number; input: any }) => {
      return await OrderService.updateOrder(id, input);
    },
    createStatus: (_: any, args: { value: string; label: string }) => {
      return OrderService.createStatus(args);
    },
    updateOrderStatus: async (
      _: any,
      { id, value, label }: { id: number; value: string; label: string }
    ) => {
      return await OrderService.updateOrderStatus(id, value, label);
    },
    deleteOrderStatus: async (_: any, { id }: { id: number }) => {
      try {
        await OrderService.deleteOrderStatus(id);
        return { success: true, message: "Status deleted successfully" };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  },
};

export default ordersResolvers;
