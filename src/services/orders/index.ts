import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import VatService from "../vat";
import {
  buildUpdatedFields,
  calculateDiscount,
  calculateOrderTotals,
  generateOrderNumber,
  handleOrderItemsUpdate,
  mergeOrderItems,
  validateAndPrepareItem,
} from "./order-utils";

type UpdateOrderInput = {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  shippingCost?: number;
  discountCode?: string;
  status?: string;
  trackingNumber?: string;
  trackingProvider?: string;
  items?: {
    productId: number;
    quantity: number;
    price: number;
  }[];
};

type ValidatedItem = {
  productId: number;
  quantity: number;
  price: number;
  preorder: boolean;
};

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
          include: {
            items: {
              include: {
                product: {
                  include: {
                    rarity: true,
                    variant: true,
                    cardType: true,
                    set: true,
                  },
                },
              },
            },
            discountCode: true,
          },
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

  async getFirstOrderByUserId(userId: number) {
    return prisma.order.findFirst({
      where: { userId },
    });
  }

  async getFirstOrderByEmail(email: string) {
    return prisma.order.findFirst({
      where: { email },
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
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      const validatedItems = await Promise.all(
        items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { stock: true },
          });

          if (!product?.price || product.price.toNumber() !== item.price) {
            throw new Error(`Invalid price for product ID ${item.productId}`);
          }

          if (!product.preorder) {
            if (!product.stock) {
              throw new Error(
                `Missing stock information for product ID ${item.productId}`
              );
            }

            if (product.stock.amount < item.quantity) {
              throw new Error(
                `Not enough stock for product ID ${item.productId}. Available: ${product.stock.amount}, requested: ${item.quantity}`
              );
            }
          }

          return {
            ...item,
            preorder: product.preorder,
          };
        })
      );

      const rawSubtotal = validatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const { discountValue, discountCodeId, isFirstOrder } =
        await calculateDiscount({
          userId: user?.id,
          email,
          subtotal: rawSubtotal,
          discountCode,
        });

      const discountedSubtotal = Math.max(rawSubtotal - discountValue, 0);
      const vatRate = 0.2;
      const vat = discountedSubtotal - discountedSubtotal / (1 + vatRate);
      const total = discountedSubtotal + shippingCost;

      const orderNumber = await generateOrderNumber(items[0].productId);

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal: new Prisma.Decimal(rawSubtotal),
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
          userId: user?.id || null,
          items: {
            create: validatedItems.map((item) => ({
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

      await Promise.all(
        validatedItems.map(async (item) => {
          if (!item.preorder) {
            await tx.stock.update({
              where: { productId: item.productId },
              data: {
                amount: {
                  decrement: item.quantity,
                },
                sold: {
                  increment: item.quantity,
                },
              },
            });
          }
        })
      );

      await VatService.createVATRecord(tx, {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        vatAmount: vat,
        subtotal: rawSubtotal,
        total,
      });

      return createdOrder;
    });
  }

  async updateOrder(id: number, data: UpdateOrderInput) {
    return prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: { select: { preorder: true } },
            },
          },
        },
      });

      if (!existingOrder) throw new Error("Order not found");

      const updatedFields = buildUpdatedFields(existingOrder, data);

      let validatedNewItems: ValidatedItem[] = [];

      if (data.items?.length) {
        validatedNewItems = await Promise.all(
          data.items.map((item) => validateAndPrepareItem(tx, item))
        );

        await handleOrderItemsUpdate(
          tx,
          id,
          existingOrder.items,
          validatedNewItems
        );
      }

      const finalOrderItems = validatedNewItems;

      const { subtotal, vat, total, discountCodeId } =
        await calculateOrderTotals({
          items: finalOrderItems,
          shippingCost: updatedFields.shippingCost,
          userId: existingOrder.userId ?? undefined,
          email: updatedFields.email,
          discountCode: data.discountCode,
        });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...updatedFields,
          subtotal,
          vat,
          total,
          discountCodeId,
        },
        include: { discountCode: true },
      });

      const vatStatusUpdate =
        updatedFields.status === "cancelled" ||
        updatedFields.status === "refunded"
          ? { status: updatedFields.status }
          : {};
      const isVoided =
        updatedFields.status === "cancelled" ||
        updatedFields.status === "refunded";

      await VatService.updateVATRecord(tx, {
        orderId: id,
        orderNumber: updatedOrder.orderNumber,
        vatAmount: isVoided ? 0 : vat.toNumber(),
        subtotal: isVoided ? 0 : subtotal.toNumber(),
        total: isVoided ? 0 : total.toNumber(),
        ...(isVoided ? { status: updatedFields.status } : {}),
        ...vatStatusUpdate,
        status: updatedFields.status,
      });

      return updatedOrder;
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
