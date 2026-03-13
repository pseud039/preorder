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
  const client = await prisma.user.upsert({
    where:{ email:"test@gmail.com"},
    update:{},
    create:{
      email:"test@gmail.com",
      passwordHash: await bcrypt.hash("Test@123",10),
      role:"customer",
      name:"Test_User",
      isActive:true,
      emailVerified:true,
      phoneVerified:true,
      phone:"9876543210"
    }

  })
  const admin = await prisma.user.upsert({
    where: { email: "predine.dev@gmail.com" },
    update: {},
    create: {
      email: "predine.dev@gmail.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "superadmin",
      name: "SuperAdmin_01",
      isActive: true,
      emailVerified: true,
      // phoneVerified: true,
      // phone: "9876543210",
    },
  });
const paymentconfig = await prisma.paymentSetup.upsert({
  where: {
    restaurantId: 3,
  },

  update: {
    fixedFee: 20.00,
    percentageFee: 5.00,
    minFee: 10.00,
    maxFee: 20.00,
  },

  create: {
    restaurantId: 3,
    fixedFee: 20.00,
    percentageFee: 5.00,
    minFee: 5.00,
    maxFee: 15.00,
  },
});

  console.log({ greenChili, admin, paymentconfig, client });
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
