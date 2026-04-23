-- CreateTable
CREATE TABLE "sadhana" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "japa_rounds" INTEGER NOT NULL DEFAULT 0,
    "mangala_arati" BOOLEAN NOT NULL DEFAULT false,
    "tulasi_puja" BOOLEAN NOT NULL DEFAULT false,
    "guru_puja" BOOLEAN NOT NULL DEFAULT false,
    "bhagavatam_class" BOOLEAN NOT NULL DEFAULT false,
    "reading_minutes" INTEGER NOT NULL DEFAULT 0,
    "service_minutes" INTEGER NOT NULL DEFAULT 0,
    "slept_at" VARCHAR(10),
    "woke_up_at" VARCHAR(10),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sadhana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sadhana_user_id_entry_date_key" ON "sadhana"("user_id", "entry_date");

-- AddForeignKey
ALTER TABLE "sadhana" ADD CONSTRAINT "sadhana_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
