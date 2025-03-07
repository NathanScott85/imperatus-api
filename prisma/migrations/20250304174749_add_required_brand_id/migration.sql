/*
  Warnings:

  - Made the column `brandId` on table `ProductSet` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProductSet" DROP CONSTRAINT "ProductSet_brandId_fkey";

-- AlterTable
ALTER TABLE "ProductSet" ALTER COLUMN "brandId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ProductSet" ADD CONSTRAINT "ProductSet_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
