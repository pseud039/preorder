/*
  Warnings:

  - You are about to drop the column `fixedFee` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `percentageFee` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `slotEnd` on the `TimeSlot` table. All the data in the column will be lost.
  - You are about to drop the column `slotStart` on the `TimeSlot` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."TimeSlot_slotStart_slotEnd_idx";

-- AlterTable
ALTER TABLE "PaymentSetup" DROP COLUMN "fixedFee",
DROP COLUMN "percentageFee",
ADD COLUMN     "fixedfee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "precentagefee" DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "TimeSlot" DROP COLUMN "slotEnd",
DROP COLUMN "slotStart",
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TimeSlot_startTime_endTime_idx" ON "TimeSlot"("startTime", "endTime");
