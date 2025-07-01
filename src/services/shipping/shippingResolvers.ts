import ShippingService from ".";

const ShippingResolvers = {
  Query: {
    getAllShippingOptions: async (
      _: any,
      args: { page?: number; limit?: number; search?: string }
    ) => {
      return ShippingService.getAllShippingOptions(args);
    },
    getAllShippingProviders: async (
      _: any,
      args: { page?: number; limit?: number; search?: string }
    ) => {
      return ShippingService.getAllShippingProviders(args);
    },
  },
  Mutation: {
    createShippingProvider: async (_: any, args: { name: string }) => {
      try {
        return ShippingService.createShippingProvider(args.name);
      } catch (error) {
        console.error("Error in createShippingProvider:", error);
        throw new Error("Invalid shipping provider name");
      }
    },
    createShippingOption: async (
      _: any,
      args: {
        name: string;
        cost: number;
        estimatedDays: number;
        description?: string;
        isActive: boolean;
        providerId: number;
      }
    ) => {
      try {
        return ShippingService.createShippingOption(args);
      } catch (error) {
        console.error("Error in createShippingOption:", error);
        throw new Error("Failed to create shipping option");
      }
    },
    updateShippingOption: async (
      _: any,
      args: {
        id: number;
        name?: string;
        cost?: number;
        estimatedDays?: number;
        description?: string;
        isActive?: boolean;
        providerId?: number;
      }
    ) => {
      try {
        return ShippingService.updateShippingOption(args);
      } catch (error) {
        console.error("Error in updateShippingOption:", error);
        throw new Error("Failed to update shipping option");
      }
    },
    updateShippingProvider: async (
      _: any,
      args: { id: number; name: string }
    ) => {
      try {
        return ShippingService.updateShippingProvider(args);
      } catch (error) {
        console.error("Error in updateShippingProvider:", error);
        throw new Error("Failed to update shipping provider");
      }
    },
  },
};

export default ShippingResolvers;
