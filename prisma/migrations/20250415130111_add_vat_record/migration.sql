-- CreateTable
CREATE TABLE "VATRecord" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "vatAmount" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VATRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VATRecord" ADD CONSTRAINT "VATRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
