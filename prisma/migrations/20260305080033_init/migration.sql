-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'patient',
    "subscription_tier" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT,
    "address_line1" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_zip" TEXT,
    "date_of_birth" TEXT,
    "mrn" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rd_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_number" TEXT,
    "license_state" TEXT,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "accepting_patients" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rd_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rd_patient_assignments" (
    "id" TEXT NOT NULL,
    "rd_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rd_patient_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "diagnosis" TEXT,
    "tube_type" TEXT,
    "tube_placement_date" TEXT,
    "current_formula" TEXT,
    "feeding_schedule" TEXT,
    "daily_volume" TEXT,
    "gi_symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gi_notes" TEXT,
    "allergies" TEXT,
    "intolerances" TEXT,
    "dietary_preferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietary_notes" TEXT,
    "has_blender" BOOLEAN NOT NULL DEFAULT false,
    "blender_type" TEXT,
    "has_food_storage" BOOLEAN NOT NULL DEFAULT false,
    "has_kitchen_scale" BOOLEAN NOT NULL DEFAULT false,
    "feeding_goal" TEXT,
    "additional_notes" TEXT,
    "payment_method" TEXT,
    "insurance_provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrient_targets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "calories_min" INTEGER,
    "calories_max" INTEGER,
    "protein_min" INTEGER,
    "protein_max" INTEGER,
    "carbs_min" INTEGER,
    "carbs_max" INTEGER,
    "fat_min" INTEGER,
    "fat_max" INTEGER,
    "fiber_min" INTEGER,
    "fiber_max" INTEGER,
    "fluids_min" INTEGER,
    "fluids_max" INTEGER,
    "feeding_schedule" TEXT,
    "safety_notes" TEXT,
    "rd_notes" TEXT,
    "set_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrient_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "severity" INTEGER NOT NULL DEFAULT 1,
    "intake_completed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grocery_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TEXT,
    "items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grocery_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_recipes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipe_name" TEXT NOT NULL,
    "ingredients" JSONB,
    "instructions" TEXT,
    "calories" INTEGER,
    "protein" INTEGER,
    "volume_ml" INTEGER,
    "prep_time" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT false,
    "initials" TEXT,
    "signed_at" TIMESTAMP(3),
    "consent_version" TEXT NOT NULL DEFAULT '1.0',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_referrals" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_name" TEXT NOT NULL,
    "doctor_fax" TEXT,
    "doctor_phone" TEXT,
    "doctor_email" TEXT,
    "doctor_practice" TEXT,
    "doctor_npi" TEXT,
    "doctor_credential" TEXT,
    "doctor_taxonomy" TEXT,
    "doctor_address_line1" TEXT,
    "doctor_address_city" TEXT,
    "doctor_address_state" TEXT,
    "doctor_address_zip" TEXT,
    "patient_diagnosis" TEXT,
    "patient_dob" TEXT,
    "patient_tube_type" TEXT,
    "clinical_goal" TEXT,
    "current_formula" TEXT,
    "daily_volume" TEXT,
    "gi_symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "insurance" TEXT,
    "policy_number" TEXT,
    "icd10_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_diagnosis_icd10" TEXT,
    "supporting_info_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pdf_storage_path" TEXT,
    "signed_pdf_storage_path" TEXT,
    "fax_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_fax_attempt_at" TIMESTAMP(3),
    "fax_provider_id" TEXT,
    "referral_status" TEXT NOT NULL DEFAULT 'pending',
    "referral_sent_at" TIMESTAMP(3),
    "referral_signed_at" TIMESTAMP(3),
    "notes" TEXT,
    "rd_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fax_logs" (
    "id" TEXT NOT NULL,
    "referral_id" TEXT,
    "event_type" TEXT NOT NULL,
    "provider_job_id" TEXT,
    "to_number" TEXT,
    "from_number" TEXT,
    "pages" INTEGER,
    "error_message" TEXT,
    "webhook_payload" JSONB,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fax_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rd_profiles_user_id_key" ON "rd_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rd_patient_assignments_rd_id_patient_id_key" ON "rd_patient_assignments"("rd_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "grocery_lists_user_id_week_start_key" ON "grocery_lists"("user_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "patient_consents_user_id_consent_type_key" ON "patient_consents"("user_id", "consent_type");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_referrals_patient_id_key" ON "doctor_referrals"("patient_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rd_profiles" ADD CONSTRAINT "rd_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rd_patient_assignments" ADD CONSTRAINT "rd_patient_assignments_rd_id_fkey" FOREIGN KEY ("rd_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rd_patient_assignments" ADD CONSTRAINT "rd_patient_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrient_targets" ADD CONSTRAINT "nutrient_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrient_targets" ADD CONSTRAINT "nutrient_targets_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_referrals" ADD CONSTRAINT "doctor_referrals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_referrals" ADD CONSTRAINT "doctor_referrals_rd_id_fkey" FOREIGN KEY ("rd_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fax_logs" ADD CONSTRAINT "fax_logs_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "doctor_referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
