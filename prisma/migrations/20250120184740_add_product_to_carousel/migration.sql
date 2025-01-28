-- AlterTable
ALTER TABLE "CarouselPage" ADD COLUMN     "productId" INTEGER;

-- AddForeignKey
ALTER TABLE "CarouselPage" ADD CONSTRAINT "CarouselPage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
