-- DropIndex
DROP INDEX "CardType_name_key";

-- CreateTable
CREATE TABLE "BrandCardType" (
    "brandId" INTEGER NOT NULL,
    "cardTypeId" INTEGER NOT NULL,

    CONSTRAINT "BrandCardType_pkey" PRIMARY KEY ("brandId","cardTypeId")
);

-- AddForeignKey
ALTER TABLE "BrandCardType" ADD CONSTRAINT "BrandCardType_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCardType" ADD CONSTRAINT "BrandCardType_cardTypeId_fkey" FOREIGN KEY ("cardTypeId") REFERENCES "CardType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
