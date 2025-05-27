import VatService from "../../services/vat";

const vatResolvers = {
  Query: {
    getAllVATRecords: async (_: any, { page, limit }: any) => {
      return VatService.getAllVATRecords(page, limit);
    },
    getTotalVAT: async () => {
      const total = await VatService.getTotalVAT();
      const totalVAT =
        typeof total === "object" && "toNumber" in total ? total.toNumber() : 0;
      return { totalVAT };
    },
  },
};

export default vatResolvers;
