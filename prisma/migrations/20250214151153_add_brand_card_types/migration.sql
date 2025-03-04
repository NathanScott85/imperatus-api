/*
  Warnings:

  - Made the column `brandId` on table `CardType` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CardType" DROP CONSTRAINT "CardType_brandId_fkey";

-- AlterTable
ALTER TABLE "CardType" ALTER COLUMN "brandId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "CardType" ADD CONSTRAINT "CardType_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
