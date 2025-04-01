-- CreateTable
CREATE TABLE "_CategorySets" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategorySets_AB_unique" ON "_CategorySets"("A", "B");

-- CreateIndex
CREATE INDEX "_CategorySets_B_index" ON "_CategorySets"("B");

-- AddForeignKey
ALTER TABLE "_CategorySets" ADD CONSTRAINT "_CategorySets_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategorySets" ADD CONSTRAINT "_CategorySets_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
