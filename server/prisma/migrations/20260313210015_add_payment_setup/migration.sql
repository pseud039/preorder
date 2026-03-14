-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'processing', 'sent', 'failed');

-- CreateTable
CREATE TABLE "EmailQueue" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "confirmationLinkToken" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "template" TEXT,
    "templateData" JSONB,
    "status" "EmailStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "userId" INTEGER,
    "orderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailQueue_status_idx" ON "EmailQueue"("status");

-- CreateIndex
CREATE INDEX "EmailQueue_createdAt_idx" ON "EmailQueue"("createdAt");
