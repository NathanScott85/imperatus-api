-- AlterTable
ALTER TABLE "products" ADD COLUMN     "rarityId" INTEGER,
ADD COLUMN     "variantId" INTEGER;

-- CreateTable
CREATE TABLE "Rarity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Rarity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rarity_name_key" ON "Rarity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_name_key" ON "ProductVariant"("name");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_setId_idx" ON "products"("setId");

-- CreateIndex
CREATE INDEX "products_productTypeId_idx" ON "products"("productTypeId");

-- CreateIndex
CREATE INDEX "products_rarityId_idx" ON "products"("rarityId");

-- CreateIndex
CREATE INDEX "products_variantId_idx" ON "products"("variantId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_rarityId_fkey" FOREIGN KEY ("rarityId") REFERENCES "Rarity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
