import VatService from "../../services/vat";

const vatResolvers = {
  Query: {
    getAllVATRecords: async (_: any, { page, limit }: any) => {
      return VatService.getAllVATRecords(page, limit);
    },
    getTotalVAT: async () => {
      const total = await VatService.getTotalVAT();
      return { totalVAT: total?.toNumber?.() || 0 };
    },
  },
};

export default vatResolvers;
