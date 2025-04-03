-- CreateTable
CREATE TABLE "_CategoryRarities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryRarities_AB_unique" ON "_CategoryRarities"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryRarities_B_index" ON "_CategoryRarities"("B");

-- AddForeignKey
ALTER TABLE "_CategoryRarities" ADD CONSTRAINT "_CategoryRarities_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryRarities" ADD CONSTRAINT "_CategoryRarities_B_fkey" FOREIGN KEY ("B") REFERENCES "Rarity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
