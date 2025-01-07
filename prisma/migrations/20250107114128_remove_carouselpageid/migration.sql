/*
  Warnings:

  - You are about to drop the column `carouselPageId` on the `CarouselItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CarouselItem" DROP CONSTRAINT "CarouselItem_carouselPageId_fkey";

-- AlterTable
ALTER TABLE "CarouselItem" DROP COLUMN "carouselPageId";

-- AddForeignKey
ALTER TABLE "CarouselItem" ADD CONSTRAINT "CarouselItem_id_fkey" FOREIGN KEY ("id") REFERENCES "CarouselPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
