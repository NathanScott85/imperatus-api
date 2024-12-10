/*
  Warnings:

  - A unique constraint covering the columns `[setCode]` on the table `ProductSet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `setCode` to the `ProductSet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductSet" ADD COLUMN     "setCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProductSet_setCode_key" ON "ProductSet"("setCode");
