/*
  Warnings:

  - A unique constraint covering the columns `[carouselPageId]` on the table `CarouselPage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "File_fileName_key";

-- AlterTable
ALTER TABLE "CarouselPage" ADD COLUMN     "carouselPageId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "CarouselPage_carouselPageId_key" ON "CarouselPage"("carouselPageId");
