/*
  Warnings:

  - You are about to drop the column `type` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "type";

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "ProductType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductTypes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductType_name_key" ON "ProductType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductTypes_AB_unique" ON "_ProductTypes"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductTypes_B_index" ON "_ProductTypes"("B");

-- AddForeignKey
ALTER TABLE "_ProductTypes" ADD CONSTRAINT "_ProductTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTypes" ADD CONSTRAINT "_ProductTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
