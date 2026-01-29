-- CreateTable
CREATE TABLE "PaymentSetup" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL DEFAULT 3,
    "fixedfee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "precentagefee" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "minFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "maxFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSetup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSetup_restaurantId_key" ON "PaymentSetup"("restaurantId");

-- CreateIndex
CREATE INDEX "PaymentSetup_restaurantId_idx" ON "PaymentSetup"("restaurantId");

-- AddForeignKey
ALTER TABLE "PaymentSetup" ADD CONSTRAINT "PaymentSetup_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
