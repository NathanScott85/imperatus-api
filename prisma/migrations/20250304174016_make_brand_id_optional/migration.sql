-- AlterTable
ALTER TABLE "ProductSet" ADD COLUMN     "brandId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProductSet" ADD CONSTRAINT "ProductSet_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
