import DiscountCodeService from "../../services/discount-codes";
import moment from "moment";

const discountCodeResolvers = {
  Query: {
    getAllDiscountCodes: async (
      _: any,
      {
        page,
        limit,
        search,
      }: { page?: number; limit?: number; search?: string }
    ) => {
      return DiscountCodeService.getAllDiscountCodes(page, limit, search);
    },
    getDiscountCodeByCode: async (_: any, { code }: { code: string }) => {
      return DiscountCodeService.getDiscountCodeByCode(code);
    },
    getDiscountCodeById: async (_: any, { id }: { id: number }) => {
      return DiscountCodeService.getDiscountCodeById(id);
    },
  },

  Mutation: {
    createDiscountCode: async (
      _: any,
      {
        input,
      }: {
        input: {
          code: string;
          description?: string;
          type: "percentage" | "fixed";
          value: number;
          expiresAt?: string;
          isAffiliate?: boolean;
          active?: boolean;
        };
      }
    ) => {
      const { code, description, type, value, expiresAt, active } = input;
      return DiscountCodeService.createDiscountCode({
        code,
        description,
        type,
        value,
        active,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
    },
    updateDiscountCode: async (
      _: any,
      {
        id,
        code,
        description,
        type,
        value,
        expiresAt,
        isAffiliate,
        active,
      }: {
        id: number;
        code?: string;
        description?: string;
        type?: "percentage" | "fixed";
        value?: number;
        expiresAt?: Date;
        isAffiliate?: boolean;
        active?: boolean;
      }
    ) => {
      return await DiscountCodeService.updateDiscountCode(id, {
        code,
        description,
        type,
        value,
        expiresAt: expiresAt ? moment(expiresAt).toDate() : undefined,
        isAffiliate,
        active,
      });
    },
    deleteDiscountCode: async (_: any, { id }: { id: number }) => {
      try {
        await DiscountCodeService.deleteDiscountCode(id);
        return true;
      } catch (error) {
        console.error("Failed to delete discount code:", error);
        throw new Error("Unable to delete discount code");
      }
    },
  },
};

export default discountCodeResolvers;
