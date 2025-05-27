-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingProvider" TEXT;

-- CreateTable
CREATE TABLE "Status" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_value_key" ON "Status"("value");
