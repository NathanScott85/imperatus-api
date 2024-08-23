/*
  Warnings:

  - You are about to drop the column `categoryId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `File` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_productId_fkey";

-- DropIndex
DROP INDEX "File_categoryId_key";

-- DropIndex
DROP INDEX "File_productId_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "categoryId",
DROP COLUMN "productId";

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_imgId_fkey" FOREIGN KEY ("imgId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_imgId_fkey" FOREIGN KEY ("imgId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
