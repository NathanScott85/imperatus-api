-- AlterTable
ALTER TABLE "CarouselPage" ADD COLUMN     "brandId" INTEGER;

-- AddForeignKey
ALTER TABLE "CarouselPage" ADD CONSTRAINT "CarouselPage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
