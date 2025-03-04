/*
  Warnings:

  - You are about to drop the `BrandCardType` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[brandId]` on the table `CardType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "BrandCardType" DROP CONSTRAINT "BrandCardType_brandId_fkey";

-- DropForeignKey
ALTER TABLE "BrandCardType" DROP CONSTRAINT "BrandCardType_cardTypeId_fkey";

-- AlterTable
ALTER TABLE "CardType" ADD COLUMN     "brandId" INTEGER;

-- DropTable
DROP TABLE "BrandCardType";

-- CreateIndex
CREATE UNIQUE INDEX "CardType_brandId_key" ON "CardType"("brandId");

-- AddForeignKey
ALTER TABLE "CardType" ADD CONSTRAINT "CardType_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
