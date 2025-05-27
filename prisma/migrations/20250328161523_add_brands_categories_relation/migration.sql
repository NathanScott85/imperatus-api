-- CreateTable
CREATE TABLE "_CategoryBrands" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryBrands_AB_unique" ON "_CategoryBrands"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryBrands_B_index" ON "_CategoryBrands"("B");

-- AddForeignKey
ALTER TABLE "_CategoryBrands" ADD CONSTRAINT "_CategoryBrands_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryBrands" ADD CONSTRAINT "_CategoryBrands_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductBrands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
