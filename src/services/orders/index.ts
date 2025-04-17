import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import VatService from "../vat";
import { calculateDiscount, generateOrderNumber } from "./order-utils";

class OrderService {
  public async getAllOrders(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) {
    try {
      const offset = (page - 1) * limit;

      const searchOnlyWhere: Prisma.OrderWhereInput | undefined = search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                email: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : undefined;

      const [orders, totalCount] = await Promise.all([
        prisma.order.findMany({
          where: searchOnlyWhere,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.order.count({
          where: searchOnlyWhere,
        }),
      ]);

      return {
        orders,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      console.error("Error retrieving orders", error);
      throw new Error(`Unable to fetch orders, ${error}`);
    }
  }

  async getAllStatus() {
    return prisma.status.findMany({
      orderBy: { id: "asc" },
    });
  }

  async getAllOrderStatuses(orderId: number) {
    return prisma.orderStatus.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getFirstOrder(email: string) {
    return prisma.order.findFirst({
      where: { email },
      orderBy: { createdAt: "asc" },
    });
  }

  async createOrder({
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
  }) {
    return prisma.$transaction(async (tx) => {
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const { discountValue, discountCodeId, isFirstOrder } =
        await calculateDiscount({
          email,
          subtotal,
          discountCode,
        });

      const discountedSubtotal = Math.max(subtotal - discountValue, 0);
      const vatRate = 0.2;
      const vat = (discountedSubtotal + shippingCost) * vatRate;
      const total = discountedSubtotal + shippingCost + vat;

      const orderNumber = await generateOrderNumber(items[0].productId);

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal: new Prisma.Decimal(subtotal),
          vat: new Prisma.Decimal(vat),
          total: new Prisma.Decimal(total),
          email,
          name,
          address,
          city,
          postcode,
          phone,
          shippingCost: new Prisma.Decimal(shippingCost),
          discountCodeId,
          firstOrder: isFirstOrder,
          items: {
            create: items.map((item) => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              price: new Prisma.Decimal(item.price),
            })),
          },
        },
        include: {
          discountCode: true,
        },
      });

      await VatService.createVATRecord(tx, {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        vatAmount: vat,
        subtotal,
        total,
      });

      return createdOrder;
    });
  }

  async createStatus({ value, label }: { value: string; label: string }) {
    return prisma.status.create({
      data: { value, label },
    });
  }

  async updateOrderStatus(id: number, value: string, label: string) {
    return prisma.status.update({
      where: { id },
      data: { value, label },
    });
  }

  async deleteOrderStatus(id: number) {
    const status = await prisma.status.findUnique({ where: { id } });
    if (!status) throw new Error("Status not found");

    const ordersWithStatus = await prisma.order.findMany({
      where: { status: status.value },
    });
    if (ordersWithStatus.length > 0) {
      throw new Error("Cannot delete status that is currently in use");
    }

    await prisma.status.delete({ where: { id } });
    return true;
  }
}

export default new OrderService();
