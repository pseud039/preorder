/*
  Warnings:

  - You are about to drop the column `fixedfee` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `precentagefee` on the `PaymentSetup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentSetup" DROP COLUMN "fixedfee",
DROP COLUMN "precentagefee",
ADD COLUMN     "fixedFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "percentageFee" DECIMAL(5,2) NOT NULL DEFAULT 0.00;
