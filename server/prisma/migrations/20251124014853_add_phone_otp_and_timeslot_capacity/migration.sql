-- AlterTable
ALTER TABLE "TimeSlot" ADD COLUMN     "bookedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PhoneOTP" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneOTP_userId_idx" ON "PhoneOTP"("userId");

-- CreateIndex
CREATE INDEX "PhoneOTP_phone_idx" ON "PhoneOTP"("phone");

-- CreateIndex
CREATE INDEX "PhoneOTP_expiresAt_idx" ON "PhoneOTP"("expiresAt");

-- CreateIndex
CREATE INDEX "PhoneOTP_verified_idx" ON "PhoneOTP"("verified");

-- CreateIndex
CREATE INDEX "TimeSlot_slotStart_isAvailable_idx" ON "TimeSlot"("slotStart", "isAvailable");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "PhoneOTP" ADD CONSTRAINT "PhoneOTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
