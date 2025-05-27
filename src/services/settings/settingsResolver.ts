import { ApolloError, AuthenticationError } from "apollo-server";
import SettingsService from ".";
import { isAdminOrOwner } from "../roles/role-checks";

const settingsResolvers = {
  Query: {
    getApplicationSettings: async () => {
      try {
        return await SettingsService.getSettings();
      } catch (error) {
        console.error("Error in getApplicationSettings:", error);
        throw new ApolloError("Failed to fetch application settings");
      }
    },
  },

  Mutation: {
    updateApplicationSettings: async (
      _: any,
      args: { comingSoon?: boolean; maintenance?: boolean },
      { user }: any
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      if (!isAdminOrOwner(user)) {
        throw new AuthenticationError("Permission denied");
      }

      try {
        return await SettingsService.updateSettings(args);
      } catch (error) {
        console.error("Error in updateApplicationSettings:", error);
        throw new ApolloError("Failed to update application settings");
      }
    },
  },
};

export default settingsResolvers;
