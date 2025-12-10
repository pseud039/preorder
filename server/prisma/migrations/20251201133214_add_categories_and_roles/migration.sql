/*
  Warnings:

  - You are about to drop the column `category` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayOrderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayOrderId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `razorpaySignature` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `TimeSlot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gatewayPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `RestaurantAdmin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RestaurantOrderStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Preparing', 'Ready', 'Completed');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'settled', 'failed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_PLACED', 'ORDER_ACCEPTED', 'ORDER_REJECTED', 'PAYMENT_REQUIRED', 'PAYMENT_RECEIVED', 'ORDER_PREPARING', 'ORDER_READY', 'ORDER_COMPLETED', 'ORDER_EXPIRED', 'PAYMENT_EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'superadmin';
ALTER TYPE "Role" ADD VALUE 'chef';

-- DropIndex
DROP INDEX "public"."MenuItem_category_idx";

-- DropIndex
DROP INDEX "public"."Order_razorpayOrderId_idx";

-- DropIndex
DROP INDEX "public"."Order_razorpayOrderId_key";

-- DropIndex
DROP INDEX "public"."Payment_razorpayOrderId_idx";

-- DropIndex
DROP INDEX "public"."Payment_razorpayPaymentId_idx";

-- DropIndex
DROP INDEX "public"."Payment_razorpayPaymentId_key";

-- DropIndex
DROP INDEX "public"."RestaurantAdmin_userId_restaurantId_key";

-- DropIndex
DROP INDEX "public"."TimeSlot_slotStart_isAvailable_idx";

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "waitingTime" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "razorpayOrderId",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "actualPickupTime" TIMESTAMP(3),
ADD COLUMN     "estimatedReadyTime" TIMESTAMP(3),
ADD COLUMN     "estimatedWaitingTime" INTEGER,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentOrderId" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "restaurantStatus" "RestaurantOrderStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "waitingTime" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpayPaymentId",
DROP COLUMN "razorpaySignature",
ADD COLUMN     "gatewayOrderId" TEXT,
ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "gatewayResponse" JSONB,
ADD COLUMN     "gatewaySignature" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "baseWaitingTimeMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
ADD COLUMN     "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
ADD COLUMN     "fixedAdditionalTime" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RestaurantAdmin" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TimeSlot" DROP COLUMN "capacity",
ADD COLUMN     "dayOfWeek" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RestaurantChef" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "specialization" TEXT,
    "shiftStart" TEXT,
    "shiftEnd" TEXT,

    CONSTRAINT "RestaurantChef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderAmount" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "restaurantAmount" DECIMAL(10,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantChef_userId_key" ON "RestaurantChef"("userId");

-- CreateIndex
CREATE INDEX "RestaurantChef_userId_idx" ON "RestaurantChef"("userId");

-- CreateIndex
CREATE INDEX "RestaurantChef_restaurantId_idx" ON "RestaurantChef"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantChef_isActive_idx" ON "RestaurantChef"("isActive");

-- CreateIndex
CREATE INDEX "Category_restaurantId_idx" ON "Category"("restaurantId");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE INDEX "Category_displayOrder_idx" ON "Category"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Category_restaurantId_name_key" ON "Category"("restaurantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_orderId_key" ON "Commission"("orderId");

-- CreateIndex
CREATE INDEX "Commission_restaurantId_idx" ON "Commission"("restaurantId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_createdAt_idx" ON "Commission"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentOrderId_key" ON "Order"("paymentOrderId");

-- CreateIndex
CREATE INDEX "Order_restaurantStatus_idx" ON "Order"("restaurantStatus");

-- CreateIndex
CREATE INDEX "Order_paymentOrderId_idx" ON "Order"("paymentOrderId");

-- CreateIndex
CREATE INDEX "Order_expiresAt_idx" ON "Order"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_gatewayPaymentId_idx" ON "Payment"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_gatewayOrderId_idx" ON "Payment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantAdmin_userId_key" ON "RestaurantAdmin"("userId");

-- CreateIndex
CREATE INDEX "RestaurantAdmin_isActive_idx" ON "RestaurantAdmin"("isActive");

-- CreateIndex
CREATE INDEX "TimeSlot_dayOfWeek_idx" ON "TimeSlot"("dayOfWeek");

-- CreateIndex
CREATE INDEX "TimeSlot_dayOfWeek_isAvailable_idx" ON "TimeSlot"("dayOfWeek", "isAvailable");

-- AddForeignKey
ALTER TABLE "RestaurantChef" ADD CONSTRAINT "RestaurantChef_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantChef" ADD CONSTRAINT "RestaurantChef_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
