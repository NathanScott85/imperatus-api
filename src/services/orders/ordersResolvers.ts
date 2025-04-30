import OrderService from "../../services/orders";
import { isAdminOrOwner } from "../roles/role-checks";

const ordersResolvers = {
  Query: {
    getAllOrders: async (
      _: any,
      {
        page,
        limit,
        search,
      }: { page?: number; limit?: number; search?: string },
      ctx: { user?: { id: string; roles: string[] } }
    ) => {
      if (!ctx?.user?.roles || !isAdminOrOwner(ctx.user)) {
        throw new Error("Unauthorized");
      }

      return OrderService.getAllOrders(page, limit, search);
    },
    getAllStatus: async () => {
      return OrderService.getAllStatus();
    },
    getAllOrderStatuses: async (_: any, { orderId }: { orderId: number }) => {
      return OrderService.getAllOrderStatuses(orderId);
    },
    getUserOrders: async (
      _: any,
      {
        email,
        userId,
        page,
        limit,
      }: { email: string; userId: number; page: number; limit: number },
      context: any
    ) => {
      if (!context.user) {
        throw new Error("Authentication required");
      }
      const requestingUserEmail = context.user.email?.toLowerCase();
      const requestingUserId = context.user.id;

      if (email && email.toLowerCase() !== requestingUserEmail) {
        throw new Error("Unauthorized access");
      }

      if (userId && userId !== requestingUserId) {
        throw new Error("Unauthorized access");
      }

      return OrderService.getOrdersByUser(email, userId, page, limit);
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
