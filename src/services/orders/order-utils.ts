import DiscountCodeService from "../discount-codes";
import OrderService from "../orders";
import { prisma } from "../../server";
import moment from "moment";

export async function calculateDiscount({
  email,
  subtotal,
  discountCode,
}: {
  email: string;
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

  const firstOrder = await OrderService.getFirstOrder(email);

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
