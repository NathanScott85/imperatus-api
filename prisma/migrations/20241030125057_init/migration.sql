/*
  Warnings:

  - Changed the type of `preorder` on the `Stock` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "preorder",
ADD COLUMN     "preorder" BOOLEAN NOT NULL;
