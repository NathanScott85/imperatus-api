import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = ["ADMIN", "USER", "OWNER"];

  for (const role of roles) {
    const roleExists = await prisma.role.findUnique({ where: { name: role } });
    if (!roleExists) {
      await prisma.role.create({ data: { name: role } });
      console.log(`Role ${role} created.`);
    } else {
      console.log(`Role ${role} already exists.`);
    }
  }

  console.log("Roles seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
