import { prisma } from "../../server";

class SettingsService {
  async getSettings() {
    const existing = await prisma.applicationSettings.findUnique({
      where: { id: 1 },
    });
    if (!existing) {
      return prisma.applicationSettings.create({
        data: { id: 1, comingSoon: false, maintenance: false },
      });
    }
    return existing;
  }

  async updateSettings(data: { comingSoon?: boolean; maintenance?: boolean }) {
    return prisma.applicationSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        comingSoon: data.comingSoon ?? false,
        maintenance: data.maintenance ?? false,
      },
    });
  }
}

export default new SettingsService();
