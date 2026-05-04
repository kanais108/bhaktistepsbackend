-- AlterTable
ALTER TABLE "content_pages" ADD COLUMN     "parent_slug" VARCHAR(100),
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "content_pages_parent_slug_sort_order_idx" ON "content_pages"("parent_slug", "sort_order");
