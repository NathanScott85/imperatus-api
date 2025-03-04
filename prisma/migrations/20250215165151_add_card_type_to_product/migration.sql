-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cardTypeId" INTEGER;

-- CreateIndex
CREATE INDEX "products_cardTypeId_idx" ON "products"("cardTypeId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_cardTypeId_fkey" FOREIGN KEY ("cardTypeId") REFERENCES "CardType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
