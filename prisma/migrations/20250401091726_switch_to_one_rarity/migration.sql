/*
  Warnings:

  - You are about to drop the `ProductRarity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductRarity" DROP CONSTRAINT "ProductRarity_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductRarity" DROP CONSTRAINT "ProductRarity_rarityId_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "rarityId" INTEGER;

-- DropTable
DROP TABLE "ProductRarity";

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
