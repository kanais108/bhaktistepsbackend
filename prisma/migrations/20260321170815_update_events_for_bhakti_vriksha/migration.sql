-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('offline', 'online', 'hybrid');

-- CreateEnum
CREATE TYPE "AttendanceMode" AS ENUM ('qr', 'self', 'admin', 'code');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('bhakti_vriksha', 'bhagavatam_class', 'mangala_arati', 'sunday_feast', 'festival', 'youth_program', 'course', 'other');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "temple_id" UUID NOT NULL,
    "group_id" UUID,
    "category" "EventCategory" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "event_mode" "EventMode" NOT NULL DEFAULT 'offline',
    "location_name" VARCHAR(200),
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "attendance_mode" "AttendanceMode" NOT NULL DEFAULT 'qr',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "temple_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50),
    "group_type" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_temple_id_name_key" ON "groups"("temple_id", "name");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "temples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "temples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
