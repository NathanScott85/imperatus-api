/*
  Warnings:

  - You are about to drop the `_ProductTypes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productTypeId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ProductTypes" DROP CONSTRAINT "_ProductTypes_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductTypes" DROP CONSTRAINT "_ProductTypes_B_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "productTypeId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_ProductTypes";

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
