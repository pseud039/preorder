import bcrypt from "bcrypt";

import { PrismaClient } from "../lib/generated/prisma/client.js";

const prisma = new PrismaClient();
async function main() {
  const greenChili = await prisma.restaurant.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Green Chili",
      description: "We make best food",
      address: "ghaziabad",
      contactNumber: "324324332",
      isActive: true,
      commissionRate: 2
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "admin",
      name: "Admin",
      isActive: true,
    },
  });

  const restAdmin = await prisma.restaurantAdmin.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      userId: admin.id,
      restaurantId: greenChili.id,
    },
  });

  console.log({ greenChili, admin, restAdmin });
}
main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed script ran successfully!");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
