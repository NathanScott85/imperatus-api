/*
  Warnings:

  - You are about to drop the `CarouselItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[imgId]` on the table `CarouselPage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CarouselItem" DROP CONSTRAINT "CarouselItem_id_fkey";

-- DropForeignKey
ALTER TABLE "CarouselItem" DROP CONSTRAINT "CarouselItem_imgId_fkey";

-- AlterTable
ALTER TABLE "CarouselPage" ADD COLUMN     "imgId" INTEGER,
ALTER COLUMN "description" DROP NOT NULL;

-- DropTable
DROP TABLE "CarouselItem";

-- CreateTable
CREATE TABLE "CarouselPages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselPages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarouselPage_imgId_key" ON "CarouselPage"("imgId");

-- AddForeignKey
ALTER TABLE "CarouselPage" ADD CONSTRAINT "CarouselPage_imgId_fkey" FOREIGN KEY ("imgId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselPage" ADD CONSTRAINT "CarouselPage_id_fkey" FOREIGN KEY ("id") REFERENCES "CarouselPages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
