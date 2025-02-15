/*
  Warnings:

  - You are about to drop the column `rarityId` on the `products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_rarityId_fkey";

-- DropIndex
DROP INDEX "products_rarityId_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "rarityId";

-- CreateTable
CREATE TABLE "ProductRarity" (
    "productId" INTEGER NOT NULL,
    "rarityId" INTEGER NOT NULL,

    CONSTRAINT "ProductRarity_pkey" PRIMARY KEY ("productId","rarityId")
);

-- AddForeignKey
ALTER TABLE "ProductRarity" ADD CONSTRAINT "ProductRarity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRarity" ADD CONSTRAINT "ProductRarity_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
