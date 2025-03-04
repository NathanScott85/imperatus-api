-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_setId_fkey";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "setId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_setId_fkey" FOREIGN KEY ("setId") REFERENCES "ProductSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
