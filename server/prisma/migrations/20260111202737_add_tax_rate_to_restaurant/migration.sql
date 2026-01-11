-- AlterEnum
ALTER TYPE "RestaurantOrderStatus" ADD VALUE 'Updated';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "taxRate" DOUBLE PRECISION DEFAULT 0.05;
