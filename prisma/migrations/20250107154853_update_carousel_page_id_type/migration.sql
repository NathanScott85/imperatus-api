-- DropForeignKey
ALTER TABLE "CarouselPage" DROP CONSTRAINT "CarouselPage_id_fkey";

-- DropIndex
DROP INDEX "CarouselPage_carouselPageId_key";

-- AlterTable
ALTER TABLE "CarouselPage" ALTER COLUMN "carouselPageId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "CarouselPage" ADD CONSTRAINT "CarouselPage_carouselPageId_fkey" FOREIGN KEY ("carouselPageId") REFERENCES "CarouselPages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
