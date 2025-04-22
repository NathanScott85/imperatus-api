import DiscountCodeService from "../discount-codes";
import OrderService from "../orders";
import { Prisma } from "@prisma/client";
import { prisma } from "../../server";
import moment from "moment";

export async function calculateDiscount({
  email,
  userId,
  subtotal,
  discountCode,
}: {
  email: string;
  userId?: number;
  subtotal: number;
  discountCode?: string;
}): Promise<{
  discountValue: number;
  discountCodeId?: number;
  isFirstOrder: boolean;
}> {
  if (discountCode) {
    const discount = await DiscountCodeService.getDiscountCodeByCode(
      discountCode
    );
    if (
      discount &&
      discount.active &&
      (!discount.expiresAt || moment(discount.expiresAt).isAfter(moment()))
    ) {
      const discountValue =
        discount.type === "percentage"
          ? (subtotal * discount.value.toNumber()) / 100
          : discount.value.toNumber();

      return {
        discountValue,
        discountCodeId: discount.id,
        isFirstOrder: false,
      };
    }
  }

  const firstOrder = userId
    ? await OrderService.getFirstOrderByUserId(userId)
    : await OrderService.getFirstOrderByEmail(email);

  if (!firstOrder) {
    return {
      discountValue: subtotal * 0.05,
      isFirstOrder: true,
    };
  }

  return {
    discountValue: 0,
    isFirstOrder: false,
  };
}

export async function generateOrderNumber(productId: number): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  const categoryCode =
    product?.category?.name?.toUpperCase().replace(/\s+/g, "") || "UNKNOWN";

  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");

  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
    where: {
      orderNumber: {
        startsWith: `IMP-${categoryCode}-${datePart}`,
      },
    },
  });

  const lastNumber = lastOrder?.orderNumber?.split("-")?.[3];
  const nextNumber = lastNumber
    ? String(Number(lastNumber) + 1).padStart(3, "0")
    : "001";

  return `IMP-${categoryCode}-${datePart}-${nextNumber}`;
}

export async function validateAndPrepareItem(
  tx: Prisma.TransactionClient,
  item: { productId: number; quantity: number; price: number }
): Promise<{
  productId: number;
  quantity: number;
  price: number;
  preorder: boolean;
}> {
  const product = await tx.product.findUnique({
    where: { id: item.productId },
    include: { stock: true },
  });

  if (!product?.price || product.price.toNumber() !== item.price) {
    throw new Error(`Invalid price for product ID ${item.productId}`);
  }

  if (!product.preorder) {
    if (!product.stock || product.stock.amount < item.quantity) {
      throw new Error(
        `Insufficient stock for product ID ${item.productId}. Available: ${
          product.stock?.amount ?? 0
        }`
      );
    }
  }

  return {
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    preorder: product.preorder ?? false,
  };
}

export function mergeOrderItems(
  existingItems: {
    productId: number;
    quantity: number;
    price: Prisma.Decimal;
    product: { preorder: boolean | null };
  }[],
  newItems: {
    productId: number;
    quantity: number;
    price: number;
    preorder: boolean;
  }[]
) {
  const map = new Map<
    number,
    { quantity: number; price: number; preorder: boolean }
  >();

  for (const item of existingItems) {
    map.set(item.productId, {
      quantity: item.quantity,
      price: item.price.toNumber(),
      preorder: item.product?.preorder ?? false,
    });
  }

  for (const item of newItems) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(item.productId, item);
    }
  }

  return Array.from(map.entries()).map(([productId, item]) => ({
    productId,
    quantity: item.quantity,
    price: item.price,
    preorder: item.preorder,
  }));
}

export function buildUpdatedFields(existingOrder: any, data: any) {
  return {
    name: data.name ?? existingOrder.name,
    email: data.email ?? existingOrder.email,
    address: data.address ?? existingOrder.address,
    city: data.city ?? existingOrder.city,
    postcode: data.postcode ?? existingOrder.postcode,
    phone: data.phone ?? existingOrder.phone,
    shippingCost: data.shippingCost ?? existingOrder.shippingCost,
    status: data.status ?? existingOrder.status,
    trackingNumber: data.trackingNumber ?? existingOrder.trackingNumber,
    trackingProvider: data.trackingProvider ?? existingOrder.trackingProvider,
  };
}

export async function handleOrderItemsUpdate(
  tx: Prisma.TransactionClient,
  orderId: number,
  existingItems: {
    productId: number;
  }[],
  newItems: {
    productId: number;
    quantity: number;
    price: number;
    preorder: boolean;
  }[]
) {
  const existingIds = new Set(existingItems.map((i) => i.productId));
  const newIds = new Set(newItems.map((i) => i.productId));

  const toRemove = [...existingIds].filter((id) => !newIds.has(id));

  if (toRemove.length > 0) {
    await tx.orderItem.deleteMany({
      where: {
        orderId,
        productId: { in: toRemove },
      },
    });
  }

  await tx.orderItem.createMany({
    data: newItems.map((item) => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: new Prisma.Decimal(item.price),
    })),
  });

  await Promise.all(
    newItems.map(async (item) => {
      if (!item.preorder) {
        await tx.stock.update({
          where: { productId: item.productId },
          data: {
            amount: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
      }
    })
  );
}

export async function calculateOrderTotals({
  items,
  shippingCost,
  discountCode,
  userId,
  email,
}: {
  items: {
    productId: number;
    quantity: number;
    price: number;
    preorder: boolean;
  }[];
  shippingCost: number;
  discountCode?: string;
  userId?: number;
  email: string;
}) {
  const subtotalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const { discountValue, discountCodeId } = await calculateDiscount({
    userId,
    email,
    subtotal: subtotalValue,
    discountCode,
  });

  const discountedSubtotal = Math.max(subtotalValue - discountValue, 0);
  const vatRate = 0.2;
  const vat = discountedSubtotal - discountedSubtotal / (1 + vatRate);
  const total = new Prisma.Decimal(discountedSubtotal).plus(
    new Prisma.Decimal(shippingCost)
  );

  return {
    subtotal: new Prisma.Decimal(subtotalValue),
    vat: new Prisma.Decimal(vat),
    total,
    discountCodeId: discountCodeId ?? null,
  };
}
