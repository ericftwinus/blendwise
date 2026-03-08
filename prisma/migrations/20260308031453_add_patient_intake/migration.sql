-- CreateTable
CREATE TABLE "patient_intakes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sex" TEXT,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "medical_diagnoses" TEXT,
    "current_medications" TEXT,
    "medication_allergies" TEXT,
    "food_allergies" TEXT,
    "surgical_history" TEXT,
    "has_recent_labs" BOOLEAN NOT NULL DEFAULT false,
    "oral_intake_description" TEXT,
    "tube_type" TEXT,
    "tube_profile" TEXT,
    "extension_set_type" TEXT,
    "french_size" TEXT,
    "unsure_french_size" BOOLEAN NOT NULL DEFAULT false,
    "last_tube_change_date" TEXT,
    "current_formula" TEXT,
    "delivery_methods" JSONB,
    "water_flushes" TEXT,
    "oral_fluid_intake" TEXT,
    "hydration_notes" TEXT,
    "gi_symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gi_symptoms_other" TEXT,
    "food_preferences" TEXT,
    "diagnosed_food_allergies" TEXT,
    "kitchen_equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kitchen_other" TEXT,
    "additional_notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_intakes_user_id_key" ON "patient_intakes"("user_id");

-- AddForeignKey
ALTER TABLE "patient_intakes" ADD CONSTRAINT "patient_intakes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
