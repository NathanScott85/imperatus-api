/*
  Warnings:

  - Added the required column `description` to the `ProductSet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductSet" ADD COLUMN     "description" TEXT NOT NULL;
