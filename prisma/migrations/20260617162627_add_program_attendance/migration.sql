-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "total_weeks" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "program_id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "tree_id" UUID,
    "name" VARCHAR(200),
    "start_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "session_date" DATE NOT NULL,
    "title" VARCHAR(200),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "marked_by_user_id" UUID,
    "status" VARCHAR(30) NOT NULL DEFAULT 'present',
    "remarks" TEXT,
    "marked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");

-- CreateIndex
CREATE INDEX "program_batches_program_id_idx" ON "program_batches"("program_id");

-- CreateIndex
CREATE INDEX "program_batches_leader_id_idx" ON "program_batches"("leader_id");

-- CreateIndex
CREATE INDEX "program_batches_tree_id_idx" ON "program_batches"("tree_id");

-- CreateIndex
CREATE INDEX "program_members_user_id_idx" ON "program_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_members_batch_id_user_id_key" ON "program_members"("batch_id", "user_id");

-- CreateIndex
CREATE INDEX "program_sessions_batch_id_idx" ON "program_sessions"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_sessions_batch_id_week_number_key" ON "program_sessions"("batch_id", "week_number");

-- CreateIndex
CREATE INDEX "program_attendance_user_id_idx" ON "program_attendance"("user_id");

-- CreateIndex
CREATE INDEX "program_attendance_marked_by_user_id_idx" ON "program_attendance"("marked_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_attendance_session_id_user_id_key" ON "program_attendance"("session_id", "user_id");

-- AddForeignKey
ALTER TABLE "program_batches" ADD CONSTRAINT "program_batches_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_batches" ADD CONSTRAINT "program_batches_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_batches" ADD CONSTRAINT "program_batches_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "leadership_trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_members" ADD CONSTRAINT "program_members_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "program_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_members" ADD CONSTRAINT "program_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "program_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_attendance" ADD CONSTRAINT "program_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_attendance" ADD CONSTRAINT "program_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_attendance" ADD CONSTRAINT "program_attendance_marked_by_user_id_fkey" FOREIGN KEY ("marked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
