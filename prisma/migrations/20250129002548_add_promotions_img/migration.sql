/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Promotion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imgId]` on the table `Promotion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "imageUrl",
ADD COLUMN     "imgId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_imgId_key" ON "Promotion"("imgId");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_imgId_fkey" FOREIGN KEY ("imgId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
