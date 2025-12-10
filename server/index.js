import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import router from './routes/client.route';
import { PrismaClient } from "./lib/generated/prisma/client.js";
import { app } from "./app.js";

const prisma = new PrismaClient();

async function main() {
}

main()
  .then(async () => {
    await prisma.$disconnect();
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on ${process.env.PORT}`);
    });
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
