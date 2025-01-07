-- DropForeignKey
ALTER TABLE "CarouselItem" DROP CONSTRAINT "CarouselItem_imgId_fkey";

-- AlterTable
ALTER TABLE "CarouselItem" ALTER COLUMN "imgId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CarouselItem" ADD CONSTRAINT "CarouselItem_imgId_fkey" FOREIGN KEY ("imgId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
