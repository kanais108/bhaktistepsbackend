-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DEVOTEE', 'SERVANT_LEADER', 'SECTOR_LEADER', 'CIRCLE_LEADER', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "marked_by_user_id" UUID,
ADD COLUMN     "tree_id" UUID;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "created_by_user_id" UUID,
ADD COLUMN     "tree_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reports_to_user_id" UUID,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'DEVOTEE',
ADD COLUMN     "tree_id" UUID;

-- CreateTable
CREATE TABLE "leadership_trees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "leadership_trees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leadership_trees_name_key" ON "leadership_trees"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "leadership_trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_reports_to_user_id_fkey" FOREIGN KEY ("reports_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "leadership_trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_user_id_fkey" FOREIGN KEY ("marked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "leadership_trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
